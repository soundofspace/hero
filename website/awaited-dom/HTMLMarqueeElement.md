# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> HTMLMarqueeElement

<div class='overview'><strong>Draft</strong><br>
    This page is not complete.</div>

## Properties

### .behavior <div class="specs"><i>W3C</i></div> {#behavior}

Sets how the text is scrolled within the marquee. Possible values are <code>scroll</code>, <code>slide</code> and <code>alternate</code>. If no value is specified, the default value is <code>scroll
</code>.

#### **Type**: `null`

### .bgColor <div class="specs"><i>W3C</i></div> {#bgColor}

Sets the background color through color name or hexadecimal value.

#### **Type**: `null`

### .direction <div class="specs"><i>W3C</i></div> {#direction}

Sets the direction of the scrolling within the marquee. Possible values are <code>left</code>, <code>right</code>, <code>up</code> and <code>down</code>. If no value is specified, the default value is <code>left
</code>.

#### **Type**: `null`

### .height <div class="specs"><i>W3C</i></div> {#height}

Sets the height in pixels or percentage value.

#### **Type**: `null`

### .hspace <div class="specs"><i>W3C</i></div> {#hspace}

Sets the horizontal margin.

#### **Type**: `null`

### .scrollAmount <div class="specs"><i>W3C</i></div> {#scrollAmount}

Sets the amount of scrolling at each interval in pixels. The default value is 6.

#### **Type**: `null`

### .scrollDelay <div class="specs"><i>W3C</i></div> {#scrollDelay}

Sets the interval between each scroll movement in milliseconds. The default value is 85. Note that any value smaller than 60 is ignored and the value 60 is used instead, unless <code>trueSpeed</code> is <code>true
</code>.

#### **Type**: `null`

### .trueSpeed <div class="specs"><i>W3C</i></div> {#trueSpeed}

By default, <code>scrollDelay</code> values lower than 60 are ignored. If <code>trueSpeed</code> is <code>true
</code>, then those values are not ignored.

#### **Type**: `null`

### .vspace <div class="specs"><i>W3C</i></div> {#vspace}

Sets the vertical margin.

#### **Type**: `null`

### .width <div class="specs"><i>W3C</i></div> {#width}

Sets the width in pixels or percentage value.

#### **Type**: `null`