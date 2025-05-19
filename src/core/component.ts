/**
 * 0x1 Component System
 * A lightweight component system for creating DOM elements with minimal overhead
 * Fully compatible with Next.js 15-style app directory components
 */

// Parameters for route components
export interface RouteParams {
  [key: string]: string;
}

// Define possible return types for components
export type ComponentReturn = HTMLElement | DocumentFragment | string | Node | null;

// Base properties for all components
export interface ComponentProps {
  [key: string]: any;
  children?: ComponentReturn | Array<ComponentReturn>;
  className?: string;
  id?: string;
  params?: RouteParams;
}

// Properties specifically for layout components
export interface LayoutProps extends ComponentProps {
  children: ComponentReturn;
  params?: RouteParams;
}

// Properties for page components
export interface PageProps extends ComponentProps {
  params?: RouteParams;
}

// Type definition for components
export type Component<P extends ComponentProps = ComponentProps> = (props: P) => ComponentReturn;

/**
 * Creates a DOM element with the specified tag and props
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: ComponentProps = {}
): HTMLElementTagNameMap[K] {
  const { children = [], className, id, ...rest } = props;
  
  // Create the element
  const element = document.createElement(tag);
  
  // Set id and class if provided
  if (id) element.id = id;
  if (className) element.className = className;
  
  // Set other attributes
  Object.entries(rest).forEach(([key, value]) => {
    if (key.startsWith('on') && typeof value === 'function') {
      // Handle event listeners (e.g. onClick -> addEventListener('click', fn))
      const eventName = key.substring(2).toLowerCase();
      element.addEventListener(eventName, value as EventListener);
    } else if (key === 'style' && typeof value === 'object') {
      // Handle style object
      Object.entries(value).forEach(([cssKey, cssValue]) => {
        (element.style as any)[cssKey] = cssValue;
      });
    } else if (value !== undefined && value !== null) {
      // Set attribute for everything else (skip null/undefined)
      element.setAttribute(key, String(value));
    }
  });
  
  // Append children
  if (Array.isArray(children)) {
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      }
    });
  } else if (children) {
    if (typeof children === 'string') {
      element.appendChild(document.createTextNode(children));
    } else if (children instanceof Node) {
      element.appendChild(children);
    }
  }
  
  return element;
}

/**
 * Creates a component that can be reused
 */
export function createComponent<P extends ComponentProps>(
  render: (props: P) => HTMLElement
): Component<P> {
  return render;
}

/**
 * Mount a component to a DOM element
 */
export function mount(component: Component | ComponentReturn, container: HTMLElement): void {
  let content: ComponentReturn;
  
  if (typeof component === 'function') {
    // Component is a function, call it to get its content
    content = component({});
  } else {
    // Component is already a rendered element
    content = component;
  }
  
  // Clear container
  container.innerHTML = '';
  
  // Append rendered content
  if (typeof content === 'string') {
    container.innerHTML = content;
  } else if (content instanceof Node) {
    container.appendChild(content);
  } else {
    console.error('Invalid component content type');
  }
}

/**
 * Updates an existing component with new props
 */
export function updateComponent<P extends ComponentProps>(
  element: HTMLElement,
  component: Component<P>,
  props: P
): HTMLElement | DocumentFragment {
  const result = component(props);
  
  // Handle different return types
  let newElement: HTMLElement | DocumentFragment;
  
  if (result === null) {
    // For null results, return an empty fragment
    newElement = document.createDocumentFragment();
  } else if (typeof result === 'string') {
    // For string results, create a text node wrapper
    const wrapper = document.createElement('span');
    wrapper.textContent = result;
    newElement = wrapper;
  } else {
    // For DOM elements, use directly
    newElement = result as HTMLElement | DocumentFragment;
  }
  
  // Replace the element in the DOM
  if (element.parentNode) {
    element.parentNode.replaceChild(newElement, element);
  }
  
  return newElement;
}

/**
 * Fragment component for grouping multiple children without a wrapper element
 */
export function Fragment(props: ComponentProps): DocumentFragment {
  const fragment = document.createDocumentFragment();
  
  const { children } = props;
  
  if (Array.isArray(children)) {
    children.forEach(child => {
      if (typeof child === 'string') {
        fragment.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        fragment.appendChild(child);
      }
    });
  } else if (children) {
    if (typeof children === 'string') {
      fragment.appendChild(document.createTextNode(children));
    } else if (children instanceof Node) {
      fragment.appendChild(children);
    }
  }
  
  return fragment;
}

/**
 * Create a DOM element from an HTML string
 */
export function fromHTML(html: string): HTMLElement {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild as HTMLElement;
}

/**
 * Create an element with specified tag name and text content
 */
export function textElement<K extends keyof HTMLElementTagNameMap>(
  tag: K, 
  text: string, 
  props: Omit<ComponentProps, 'children'> = {}
): HTMLElementTagNameMap[K] {
  return createElement(tag, { ...props, children: [text] });
}

/**
 * Create a component from a template string
 * This allows for markup-like syntax in strings
 */
export function template(strings: TemplateStringsArray, ...values: any[]): HTMLElement {
  const html = strings.reduce((result, str, i) => {
    const value = values[i] || '';
    return result + str + value;
  }, '');
  
  return fromHTML(html);
}
