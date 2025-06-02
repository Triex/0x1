/**
 * 0x1 DOM Utilities
 * Lightweight DOM manipulation helpers for efficient updates
 */

/**
 * Efficiently sets multiple attributes on an element
 */
export function setAttributes(element: HTMLElement, attributes: Record<string, string>): void {
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

/**
 * Efficiently sets multiple CSS properties on an element
 */
export function setStyles(element: HTMLElement, styles: Record<string, string>): void {
  Object.entries(styles).forEach(([property, value]) => {
    (element.style as any)[property] = value;
  });
}

/**
 * Efficiently adds multiple event listeners to an element
 */
export function addEventListeners(
  element: HTMLElement,
  events: Record<string, EventListener>
): void {
  Object.entries(events).forEach(([event, handler]) => {
    element.addEventListener(event, handler);
  });
}

/**
 * Removes all children from an element
 */
export function clearElement(element: HTMLElement): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Creates a DOM element with specified properties
 */
export function createElementWithProps<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  props: {
    attributes?: Record<string, string>;
    styles?: Record<string, string>;
    events?: Record<string, EventListener>;
    innerHTML?: string;
    children?: (HTMLElement | Text)[];
  } = {}
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  
  if (props.attributes) {
    setAttributes(element, props.attributes);
  }
  
  if (props.styles) {
    setStyles(element, props.styles);
  }
  
  if (props.events) {
    addEventListeners(element, props.events);
  }
  
  if (props.innerHTML !== undefined) {
    element.innerHTML = props.innerHTML;
  }
  
  if (props.children && props.children.length > 0) {
    props.children.forEach(child => {
      element.appendChild(child);
    });
  }
  
  return element;
}

/**
 * Efficient element diffing and patching algorithm
 * This allows partial DOM updates instead of full replacement
 */
export function patchElement(oldEl: HTMLElement, newEl: HTMLElement): void {
  // Transfer attributes
  Array.from(newEl.attributes).forEach(attr => {
    if (oldEl.getAttribute(attr.name) !== attr.value) {
      oldEl.setAttribute(attr.name, attr.value);
    }
  });
  
  // Remove attributes not in new element
  Array.from(oldEl.attributes).forEach(attr => {
    if (!newEl.hasAttribute(attr.name)) {
      oldEl.removeAttribute(attr.name);
    }
  });
  
  // If content is just text, update efficiently
  if (
    newEl.children.length === 0 && 
    oldEl.children.length === 0 && 
    newEl.textContent !== oldEl.textContent
  ) {
    oldEl.textContent = newEl.textContent;
    return;
  }
  
  // Recursive diffing of children
  const oldChildren = Array.from(oldEl.children);
  const newChildren = Array.from(newEl.children);
  
  // Remove extra children
  for (let i = newChildren.length; i < oldChildren.length; i++) {
    oldEl.removeChild(oldChildren[i]);
  }
  
  // Update existing children
  for (let i = 0; i < newChildren.length; i++) {
    if (i < oldChildren.length) {
      if (oldChildren[i].tagName === newChildren[i].tagName) {
        // Same element type, patch it
        patchElement(oldChildren[i] as HTMLElement, newChildren[i] as HTMLElement);
      } else {
        // Different element type, replace it
        oldEl.replaceChild(newChildren[i], oldChildren[i]);
      }
    } else {
      // Add new child
      oldEl.appendChild(newChildren[i]);
    }
  }
}

/**
 * Create DOM nodes from HTML strings
 */
export function createFromHTML(html: string): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content;
}

/**
 * Find elements by query selector with automatic typing
 */
export function select<K extends keyof HTMLElementTagNameMap>(
  selectors: K
): HTMLElementTagNameMap[K] | null;
export function select(selectors: string): HTMLElement | null;
export function select(selectors: string): HTMLElement | null {
  return document.querySelector(selectors);
}

/**
 * Find all elements matching a selector
 */
export function selectAll<K extends keyof HTMLElementTagNameMap>(
  selectors: K
): NodeListOf<HTMLElementTagNameMap[K]>;
export function selectAll(selectors: string): NodeListOf<HTMLElement>;
export function selectAll(selectors: string): NodeListOf<HTMLElement> {
  return document.querySelectorAll(selectors);
}

/**
 * Check if an element matches a selector
 */
export function matches(element: HTMLElement, selector: string): boolean {
  return element.matches(selector);
}

/**
 * Find the closest ancestor that matches a selector
 */
export function closest(element: HTMLElement, selector: string): HTMLElement | null {
  return element.closest(selector);
}

/**
 * Insert element after another element
 */
export function insertAfter(newNode: Node, referenceNode: Node): void {
  if (referenceNode.parentNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  }
}

/**
 * Check if an element contains another element
 */
export function contains(parent: HTMLElement, child: HTMLElement): boolean {
  return parent.contains(child);
}

/**
 * Get computed style for an element
 */
export function getStyle(element: HTMLElement, property: string): string {
  return window.getComputedStyle(element).getPropertyValue(property);
}

/**
 * Set or get data attributes on an element
 */
export function data(element: HTMLElement, key: string, value?: string): string | undefined {
  if (value === undefined) {
    return element.dataset[key];
  } else {
    element.dataset[key] = value;
    return value;
  }
}

/**
 * Add multiple classes to an element
 */
export function addClass(element: HTMLElement, ...classNames: string[]): void {
  element.classList.add(...classNames);
}

/**
 * Remove multiple classes from an element
 */
export function removeClass(element: HTMLElement, ...classNames: string[]): void {
  element.classList.remove(...classNames);
}

/**
 * Toggle a class on an element
 */
export function toggleClass(element: HTMLElement, className: string, force?: boolean): boolean {
  return element.classList.toggle(className, force);
}

/**
 * Escape special characters in component IDs for CSS selectors
 * Only escape characters that are actually problematic in CSS attribute selectors
 */
export function escapeComponentIdForSelector(componentId: string): string {
  // For attribute selectors, we only need to escape quotes and backslashes
  // Curly braces {} are fine in attribute values and don't need escaping
  return componentId.replace(/['"\\]/g, '\\$&');
}

/**
 * Find DOM elements for a component with proper ID escaping
 */
export function findComponentElements(componentId: string): NodeListOf<Element> {
  const escapedId = escapeComponentIdForSelector(componentId);
  return document.querySelectorAll(`[data-component-id="${escapedId}"]`);
}

/**
 * Add component metadata attributes to a DOM element
 */
export function addComponentMetadata(element: Element, componentId: string, componentName: string): void {
  element.setAttribute('data-component-id', componentId);
  element.setAttribute('data-component-name', componentName);
}
