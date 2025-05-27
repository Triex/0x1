/**
 * TypeScript JSX interfaces for the 0x1 framework
 * This file defines the core JSX types used throughout the framework
 * 
 * IMPORTANT: These types are exported to consuming applications through the
 * JSX namespace, which is globally available when using the framework
 */

// Import our JSX definitions to ensure they're available
/// <reference path="../../types/jsx.d.ts" />
/// <reference path="../../types/jsx-runtime.d.ts" />

// These types can be used internally in the framework
export type JSXElement = {
  type: string | ComponentFunction;
  props: any;
  children: any[];
  key?: string | number | null;
  __source?: {
    fileName: string;
    lineNumber: number;
    columnNumber: number;
  };
  __self?: any;
};

export type ComponentFunction<P = any> = (props: P) => JSXElement | string | number | null;
export type ComponentProps<T extends ComponentFunction> = T extends ComponentFunction<infer P> ? P : never;

// Export attribute and element types
export type HTMLAttributes = {
  [key: string]: any;
  className?: string;
  style?: string | Record<string, string | number>;
  id?: string;
  onClick?: (e: any) => void;
  // Add more common attributes as needed
};

// Re-export these types from the globally defined JSX namespace
export namespace JSX {
  interface IntrinsicElements {
    // HTML elements
    a: any;
    abbr: any;
    address: any;
    area: any;
    article: any;
    aside: any;
    audio: any;
    b: any;
    base: any;
    bdi: any;
    bdo: any;
    blockquote: any;
    body: any;
    br: any;
    button: any;
    canvas: any;
    caption: any;
    cite: any;
    code: any;
    col: any;
    colgroup: any;
    data: any;
    datalist: any;
    dd: any;
    del: any;
    details: any;
    dfn: any;
    dialog: any;
    div: any;
    dl: any;
    dt: any;
    em: any;
    embed: any;
    fieldset: any;
    figcaption: any;
    figure: any;
    footer: any;
    form: any;
    h1: any;
    h2: any;
    h3: any;
    h4: any;
    h5: any;
    h6: any;
    head: any;
    header: any;
    hr: any;
    html: any;
    i: any;
    iframe: any;
    img: any;
    input: any;
    ins: any;
    kbd: any;
    label: any;
    legend: any;
    li: any;
    link: any;
    main: any;
    map: any;
    mark: any;
    menu: any;
    meta: any;
    meter: any;
    nav: any;
    noscript: any;
    object: any;
    ol: any;
    optgroup: any;
    option: any;
    output: any;
    p: any;
    param: any;
    picture: any;
    pre: any;
    progress: any;
    q: any;
    rp: any;
    rt: any;
    ruby: any;
    s: any;
    samp: any;
    script: any;
    section: any;
    select: any;
    slot: any;
    small: any;
    source: any;
    span: any;
    strong: any;
    style: any;
    sub: any;
    summary: any;
    sup: any;
    table: any;
    tbody: any;
    td: any;
    template: any;
    textarea: any;
    tfoot: any;
    th: any;
    thead: any;
    time: any;
    title: any;
    tr: any;
    track: any;
    u: any;
    ul: any;
    var: any;
    video: any;
    wbr: any;
    
    // SVG elements
    svg: any;
    animate: any;
    animateMotion: any;
    animateTransform: any;
    circle: any;
    clipPath: any;
    defs: any;
    desc: any;
    ellipse: any;
    feBlend: any;
    feColorMatrix: any;
    feComponentTransfer: any;
    feComposite: any;
    feConvolveMatrix: any;
    feDiffuseLighting: any;
    feDisplacementMap: any;
    feDistantLight: any;
    feDropShadow: any;
    feFlood: any;
    feFuncA: any;
    feFuncB: any;
    feFuncG: any;
    feFuncR: any;
    feGaussianBlur: any;
    feImage: any;
    feMerge: any;
    feMergeNode: any;
    feMorphology: any;
    feOffset: any;
    fePointLight: any;
    feSpecularLighting: any;
    feSpotLight: any;
    feTile: any;
    feTurbulence: any;
    filter: any;
    foreignObject: any;
    g: any;
    image: any;
    line: any;
    linearGradient: any;
    marker: any;
    mask: any;
    metadata: any;
    mpath: any;
    path: any;
    pattern: any;
    polygon: any;
    polyline: any;
    radialGradient: any;
    rect: any;
    stop: any;
    switch: any;
    symbol: any;
    text: any;
    textPath: any;
    tspan: any;
    use: any;
    view: any;
  }
  
  interface ElementClass {
    render: any;
  }
  
  interface ElementAttributesProperty {
    props: any;
  }
  
  interface ElementChildrenAttribute {
    children: any;
  }
}
