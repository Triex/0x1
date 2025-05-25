// src/jsx-runtime.ts
function createElement(type, props, ...children) {
  return {
    type,
    props: props || {},
    children: children.flat().filter((child) => child !== undefined && child !== null && child !== false)
  };
}
var Fragment = (props) => {
  return {
    type: "fragment",
    props: {},
    children: props.children || []
  };
};
function jsx(type, props, key) {
  const { children, ...restProps } = props || {};
  const normalizedChildren = children ? Array.isArray(children) ? children : [children] : [];
  return {
    type,
    props: restProps,
    children: normalizedChildren,
    key: key || null
  };
}
function jsxs(type, props, _key) {
  return jsx(type, props, _key);
}

// src/jsx-dev-runtime.ts
var REACT_ELEMENT = Symbol.for("react.element");
var REACT_FRAGMENT = Symbol.for("react.fragment");
var REACT_SERVER_COMPONENT = Symbol.for("react.server.component");
var componentStack = [];
function jsxDEV(type, props, key = null, isStaticChildren = false, source, self) {
  if (typeof type === "string") {
    return {
      $$typeof: REACT_ELEMENT,
      type,
      key,
      ref: null,
      props: props || {},
      _owner: null
    };
  }
  const isServerComponent = typeof type === "object" && type !== null && "$$typeof" in type && type.$$typeof === REACT_SERVER_COMPONENT;
  const typeName = typeof type === "function" ? type.displayName || type.name || "Component" : isServerComponent ? "ServerComponent" : "Unknown";
  componentStack.push(typeName);
  try {
    const keyParam = key === null ? undefined : key;
    const jsxResult = jsx(type, props || {}, keyParam);
    componentStack.pop();
    const reactElement = {
      $$typeof: REACT_ELEMENT,
      type: typeof jsxResult === "object" && jsxResult !== null && "type" in jsxResult ? jsxResult.type : typeof type === "string" ? type : "div",
      key,
      ref: null,
      props: typeof jsxResult === "object" && jsxResult !== null && "props" in jsxResult ? jsxResult.props : props || {},
      _owner: null
    };
    if (source) {
      Object.defineProperty(reactElement, "_source", {
        configurable: false,
        enumerable: false,
        writable: false,
        value: source
      });
    }
    return reactElement;
  } catch (error) {
    const componentStackTrace = [...componentStack].reverse().join(" > ");
    componentStack.pop();
    console.error(`[0x1] Error in component: ${typeName}`);
    console.error(`[0x1] Component stack: ${componentStackTrace}`);
    if (source) {
      console.error(`[0x1] Source: ${source.fileName}:${source.lineNumber}:${source.columnNumber}`);
    }
    return {
      $$typeof: REACT_ELEMENT,
      type: "div",
      key: null,
      ref: null,
      props: {
        className: "0x1-error-boundary",
        style: `
          color: #dc2626; 
          background: rgba(254, 226, 226, 0.9);
          padding: 0.75rem;
          border-radius: 0.375rem;
          border-left: 4px solid #dc2626;
          font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
          margin: 0.5rem 0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        `,
        children: [
          createElement("div", {
            style: "font-weight: 600; font-size: 0.875rem; margin-bottom: 0.5rem;"
          }, `\uD83D\uDEAB Error in <${typeName}>`),
          createElement("pre", {
            style: "margin: 0.5rem 0; font-size: 0.75rem; overflow-x: auto; padding: 0.5rem; background: rgba(0,0,0,0.05); border-radius: 0.25rem;"
          }, error instanceof Error ? error.message : String(error)),
          createElement("details", {
            style: "font-size: 0.75rem; margin-top: 0.5rem;"
          }, createElement("summary", { style: "cursor: pointer; opacity: 0.8;" }, "Component Stack"), createElement("div", { style: "padding: 0.5rem; white-space: pre-wrap;" }, componentStackTrace))
        ]
      },
      _owner: null
    };
  }
}
function createErrorBoundary(fallback) {
  return function ErrorBoundary(props) {
    try {
      if (!props.children) {
        return {
          $$typeof: REACT_ELEMENT,
          type: "div",
          key: null,
          ref: null,
          props: {},
          _owner: null
        };
      }
      return {
        $$typeof: REACT_ELEMENT,
        type: "div",
        key: null,
        ref: null,
        props: {
          className: "0x1-boundary",
          children: props.children
        },
        _owner: null
      };
    } catch (error) {
      return fallback(error instanceof Error ? error : new Error(String(error)), { componentStack: componentStack.join(" > ") });
    }
  };
}
export {
  jsxs,
  jsxDEV,
  jsx,
  createErrorBoundary,
  createElement,
  REACT_SERVER_COMPONENT,
  REACT_FRAGMENT,
  REACT_ELEMENT,
  Fragment
};
