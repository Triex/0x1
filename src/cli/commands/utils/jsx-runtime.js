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
function jsxDEV(type, props, key, isStaticChildren, source, self) {
  const node = jsx(type, props, key);
  if (source) {
    node.__source = source;
  }
  if (self) {
    node.__self = self;
  }
  return node;
}
function renderToString(node) {
  if (node === undefined || node === null || node === false || node === true) {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (node.type === "fragment") {
    return node.children.map((child) => renderToString(child)).join("");
  }
  if (typeof node.type === "function") {
    const result = node.type({
      ...node.props,
      children: node.children
    });
    if (typeof result === "string") {
      return result;
    }
    return renderToString(result);
  }
  let html = `<${node.type}`;
  for (const [key, value] of Object.entries(node.props)) {
    if (key === "children" || value === undefined)
      continue;
    if (key === "className") {
      html += ` class="${escapeHtml(String(value))}"`;
      continue;
    }
    if (key === "htmlFor") {
      html += ` for="${escapeHtml(String(value))}"`;
      continue;
    }
    if (key.startsWith("on") && typeof value === "function") {
      const eventName = key.toLowerCase();
      html += ` ${eventName}="${escapeHtml(String(value))}"`;
      continue;
    }
    if (typeof value === "boolean") {
      if (value) {
        html += ` ${key}`;
      }
      continue;
    }
    html += ` ${key}="${escapeHtml(String(value))}"`;
  }
  const voidElements = [
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr"
  ];
  if (voidElements.includes(node.type)) {
    return `${html} />`;
  }
  html += ">";
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      html += renderToString(child);
    }
  }
  html += `</${node.type}>`;
  return html;
}
function escapeHtml(html) {
  return html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
export {
  renderToString,
  jsxs,
  jsxDEV,
  jsx,
  createElement,
  Fragment as JSXFragment,
  Fragment
};
