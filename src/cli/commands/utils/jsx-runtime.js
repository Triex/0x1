// src/jsx-runtime.ts
var Fragment = Symbol.for("0x1.fragment");
function jsx(type, props, key) {
  const { children, ...otherProps } = props || {};
  if (typeof type === "function") {
    return type({ children, ...otherProps });
  }
  return {
    type,
    props: otherProps,
    children: Array.isArray(children) ? children : children !== undefined ? [children] : [],
    key: key || null
  };
}
function jsxs(type, props, key) {
  return jsx(type, props, key);
}
function createElement(type, props, ...children) {
  if (type === Fragment) {
    return {
      type: Fragment,
      props: {},
      children: children.flat(),
      key: null
    };
  }
  const childArray = children.flat().filter((child) => child != null);
  return jsx(type, { ...props, children: childArray });
}
function renderToString(node) {
  if (!node)
    return "";
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map((child) => renderToString(child)).join("");
  }
  if (node.type === Fragment) {
    return node.children.map((child) => renderToString(child)).join("");
  }
  if (typeof node.type === "function") {
    const result = node.type(node.props);
    return renderToString(result);
  }
  const tag = node.type;
  const attrs = Object.entries(node.props || {}).filter(([key, value]) => value != null && key !== "children").map(([key, value]) => {
    if (typeof value === "boolean") {
      return value ? key : "";
    }
    const attrName = key === "className" ? "class" : key;
    return `${attrName}="${String(value).replace(/"/g, "&quot;")}"`;
  }).filter((attr) => attr).join(" ");
  const children = node.children?.map((child) => renderToString(child)).join("") || "";
  const selfClosing = ["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"];
  if (selfClosing.includes(tag)) {
    return `<${tag}${attrs ? " " + attrs : ""} />`;
  }
  return `<${tag}${attrs ? " " + attrs : ""}>${children}</${tag}>`;
}
function renderToDOM(node) {
  if (!node)
    return null;
  if (typeof node === "string" || typeof node === "number") {
    return document.createTextNode(String(node));
  }
  if (Array.isArray(node)) {
    const fragment = document.createDocumentFragment();
    node.forEach((child) => {
      const childNode = renderToDOM(child);
      if (childNode)
        fragment.appendChild(childNode);
    });
    return fragment;
  }
  if (node.type === Fragment) {
    const fragment = document.createDocumentFragment();
    node.children.forEach((child) => {
      const childNode = renderToDOM(child);
      if (childNode)
        fragment.appendChild(childNode);
    });
    return fragment;
  }
  if (typeof node.type === "function") {
    const result = node.type(node.props);
    return renderToDOM(result);
  }
  const element = document.createElement(node.type);
  Object.entries(node.props || {}).forEach(([key, value]) => {
    if (key === "children")
      return;
    if (key.startsWith("on") && typeof value === "function") {
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else if (key === "className") {
      element.className = String(value);
    } else if (key === "style" && typeof value === "object") {
      Object.assign(element.style, value);
    } else if (value != null) {
      element.setAttribute(key, String(value));
    }
  });
  node.children?.forEach((child) => {
    const childNode = renderToDOM(child);
    if (childNode)
      element.appendChild(childNode);
  });
  return element;
}
export {
  renderToString,
  renderToDOM,
  jsxs,
  jsx,
  createElement,
  Fragment
};
