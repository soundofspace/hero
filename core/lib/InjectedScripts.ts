import * as fs from 'fs';
import { IPage } from '@unblocked-web/specifications/agent/browser/IPage';
import { stringifiedTypeSerializerClass } from '@ulixee/commons/lib/TypeSerializer';

const pageScripts = {
  domStorage: fs.readFileSync(`${__dirname}/../injected-scripts/domStorage.js`, 'utf8'),
  indexedDbRestore: fs.readFileSync(`${__dirname}/../injected-scripts/indexedDbRestore.js`, 'utf8'),
  interactReplayer: fs.readFileSync(`${__dirname}/../injected-scripts/interactReplayer.js`, 'utf8'),
  DomAssertions: fs.readFileSync(`${__dirname}/../injected-scripts/DomAssertions.js`, 'utf8'),
  Fetcher: fs.readFileSync(`${__dirname}/../injected-scripts/Fetcher.js`, 'utf8'),
  pageEventsRecorder: fs.readFileSync(
    `${__dirname}/../injected-scripts/pageEventsRecorder.js`,
    'utf8',
  ),
};
const pageEventsCallbackName = '__heroPageListenerCallback';

export const heroIncludes = `
const exports = {}; // workaround for ts adding an exports variable

${pageScripts.Fetcher};
${pageScripts.DomAssertions};

window.HERO = {
  Fetcher,
  DomAssertions,
};
`;

const injectedScript = `(function installInjectedScripts() {
${heroIncludes}

(function installDomRecorder(runtimeFunction) {
   ${pageScripts.pageEventsRecorder}
})('${pageEventsCallbackName}');

${pageScripts.domStorage}
})();`;

const showInteractionScript = `(function installInteractionsScript() {
const exports = {}; // workaround for ts adding an exports variable

window.selfFrameIdPath = '';
if (!('blockClickAndSubmit' in window)) window.blockClickAndSubmit = false;

if (!('getNodeById' in window)) {
  window.getNodeById = function getNodeById(id) {
    if (id === null || id === undefined) return null;
    return NodeTracker.getWatchedNodeWithId(id, false);
  };
}

${pageScripts.interactReplayer};
})();`;

const installedSymbol = Symbol('InjectedScripts.Installed');

export const CorePageInjectedScript = heroIncludes;

export default class InjectedScripts {
  public static Fetcher = `HERO.Fetcher`;
  public static PageEventsCallbackName = pageEventsCallbackName;

  public static install(page: IPage, showInteractions = false): Promise<any> {
    if (page[installedSymbol]) return;
    page[installedSymbol] = true;

    return Promise.all([
      page.addPageCallback(pageEventsCallbackName, null, true),
      page.addNewDocumentScript(injectedScript, true),
      showInteractions ? page.addNewDocumentScript(showInteractionScript, true) : null,
    ]);
  }

  public static installInteractionScript(page: IPage, isolatedFromWebPage = true): Promise<{ identifier: string }> {
    return page.addNewDocumentScript(showInteractionScript, isolatedFromWebPage);
  }

  public static getIndexedDbStorageRestoreScript(): string {
    return `(function restoreIndexedDB() {
const exports = {}; // workaround for ts adding an exports variable
${stringifiedTypeSerializerClass};
${pageScripts.indexedDbRestore};
})();`;
  }
}
