import { IPaintEvent } from '@ulixee/hero-core/models/DomChangesTable';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import { ITabDetails, ITick } from './getTimetravelTicks';
import MirrorPage from '../lib/MirrorPage';

export default class TabPlaybackController {
  public get id(): number {
    return this.tabDetails.tab.id;
  }

  public get ticks(): ITick[] {
    return this.tabDetails.ticks;
  }

  public get currentTick(): ITick {
    return this.ticks[this.currentTickIndex];
  }

  public get nextTick(): ITick {
    return this.ticks[this.currentTickIndex + 1];
  }

  public get previousTick(): ITick {
    return this.ticks[this.currentTickIndex - 1];
  }

  public get nextTimelineOffsetPercent(): number {
    const currentOffset = this.currentTick?.timelineOffsetPercent || 0;
    let tick: ITick;
    for (let i = this.currentTickIndex; i < this.ticks.length; i += 1) {
      tick = this.ticks[i];
      if (tick && tick.timelineOffsetPercent > currentOffset) {
        return tick.timelineOffsetPercent;
      }
    }
    return 100;
  }

  public get previousTimelineOffsetPercent(): number {
    const currentOffset = this.currentTick?.timelineOffsetPercent || 0;
    let tick: ITick;
    for (let i = this.currentTickIndex; i >= 0; i -= 1) {
      tick = this.ticks[i];
      if (tick && tick.timelineOffsetPercent < currentOffset) {
        return tick.timelineOffsetPercent;
      }
    }
    return 0;
  }

  public get focusedPaintIndexes(): [start: number, end: number] {
    if (!this.focusedTickRange) {
      return [this.currentTick?.paintEventIndex, this.currentTick?.paintEventIndex];
    }
    const [start, end] = this.focusedTickRange;
    const startTick = this.ticks[start];
    const endTick = this.ticks[end];
    return [startTick?.paintEventIndex ?? -1, endTick?.paintEventIndex ?? -1];
  }

  public currentTimelineOffsetPct = 0;
  public isPlaying = false;
  public currentTickIndex = -1;
  public focusedOffsetRange: [start: number, end: number];
  private events = new EventSubscriber();

  // put in placeholder
  private paintEventsLoadedIdx = -1;
  private focusedTickRange: [start: number, end: number];

  constructor(private readonly tabDetails: ITabDetails, public readonly mirrorPage: MirrorPage) {
    this.events.once(this.mirrorPage, 'close', () => {
      this.paintEventsLoadedIdx = -1;
      this.isPlaying = false;
      this.currentTickIndex = -1;
      this.currentTimelineOffsetPct = 0;
    });
  }

  public updateTabDetails(tabDetails: ITabDetails): void {
    Object.assign(this.tabDetails, tabDetails);
    if (this.currentTickIndex >= 0) {
      this.currentTimelineOffsetPct =
        this.tabDetails.ticks[this.currentTickIndex]?.timelineOffsetPercent;
    }
  }

  public async gotoStart(): Promise<void> {
    if (this.mirrorPage.page.mainFrame.url === 'about:blank') {
      await this.mirrorPage.page.navigate(this.tabDetails.documents[0].url);
    }
  }

  public async play(onTick?: (tick: ITick) => void): Promise<void> {
    let pendingMillisDeficit = 0;
    this.isPlaying = true;

    for (let i = this.currentTickIndex; i < this.ticks.length; i += 1) {
      if (!this.isPlaying) break;
      if (i < 0) continue;

      const startTime = Date.now();
      await this.loadTick(i);
      onTick(this.ticks[i]);
      const fnDuration = Date.now() - startTime;

      if (i < this.ticks.length - 1) {
        const currentTick = this.ticks[i];
        const nextTick = this.ticks[i + 1];
        const diff = nextTick.timestamp - currentTick.timestamp;
        const delay = diff - fnDuration - pendingMillisDeficit;

        if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
        else if (delay < 0) pendingMillisDeficit = Math.abs(delay);
      }
    }
  }

  public pause(): void {
    this.isPlaying = false;
  }

  public close(): void {
    this.events.close();
  }

  public setFocusedOffsetRange(offsetRange: [start: number, end: number]): void {
    if (!offsetRange) {
      this.focusedTickRange = null;
      this.focusedOffsetRange = null;
      return;
    }
    const [startPercent, endPercent] = offsetRange;
    this.focusedOffsetRange = offsetRange;
    this.focusedTickRange = [-1, -1];
    for (let i = 0; i < this.ticks.length; i += 1) {
      const offset = this.ticks[i].timelineOffsetPercent;
      if (offset < startPercent) continue;
      if (offset > endPercent) break;

      if (this.focusedTickRange[0] === -1) {
        this.focusedTickRange[0] = i;
      }
      this.focusedTickRange[1] = i;
    }
    if (this.focusedTickRange[1] === -1) this.focusedTickRange[1] = this.currentTickIndex;
  }

  public findClosestTickIndex(timelineOffset: number): number {
    const ticks = this.ticks;
    if (!ticks.length || this.currentTimelineOffsetPct === timelineOffset)
      return this.currentTickIndex;

    let newTickIdx = this.currentTickIndex;
    // if going forward, load next ticks
    if (timelineOffset > this.currentTimelineOffsetPct) {
      for (let i = newTickIdx; i < ticks.length; i += 1) {
        if (i < 0) continue;
        if (ticks[i].timelineOffsetPercent > timelineOffset) break;
        newTickIdx = i;
      }
    } else {
      for (let i = newTickIdx; i >= 0; i -= 1) {
        newTickIdx = i;
        if (ticks[i].timelineOffsetPercent <= timelineOffset) break;
      }
    }
    return newTickIdx;
  }

  public async setTimelineOffset(timelineOffset: number): Promise<void> {
    const newTickIdx = this.findClosestTickIndex(timelineOffset);
    if (this.currentTickIndex === newTickIdx) return;
    await this.loadTick(newTickIdx, timelineOffset);
  }

  public async loadEndState(): Promise<void> {
    await this.loadTick(this.ticks.length - 1);
  }

  public async loadTick(
    newTickOrIdx: number | ITick,
    specificTimelineOffset?: number,
  ): Promise<void> {
    if (newTickOrIdx === this.currentTickIndex || newTickOrIdx === this.currentTick) {
      return;
    }
    const mirrorPage = this.mirrorPage;

    let newTick = newTickOrIdx as ITick;
    let newTickIdx = newTickOrIdx as number;
    if (typeof newTickOrIdx === 'number') {
      newTick = this.ticks[newTickOrIdx];
    } else {
      newTickIdx = this.ticks.indexOf(newTickOrIdx);
    }

    this.currentTickIndex = newTickIdx;
    this.currentTimelineOffsetPct = specificTimelineOffset ?? newTick.timelineOffsetPercent;

    const newPaintIndex = newTick.paintEventIndex;
    if (newPaintIndex !== this.paintEventsLoadedIdx) {
      this.paintEventsLoadedIdx = newPaintIndex;
      await mirrorPage.load(newPaintIndex);
    }

    const mouseEvent = this.tabDetails.mouse[newTick.mouseEventIndex];
    const scrollEvent = this.tabDetails.scroll[newTick.scrollEventIndex];
    const nodesToHighlight = newTick.highlightNodeIds;

    if (nodesToHighlight || mouseEvent || scrollEvent) {
      await mirrorPage.showInteractions(nodesToHighlight, mouseEvent, scrollEvent);
    }
  }

  public async showStatusText(text: string): Promise<void> {
    await this.mirrorPage.showStatusText(text);
  }

  public getPaintEventAtIndex(index: number): IPaintEvent {
    return this.tabDetails.paintEvents[index];
  }
}
