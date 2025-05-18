/**
 * 0x1 Component System
 * A lightweight component system for creating DOM elements with minimal overhead
 */

export interface ComponentProps {
  [key: string]: any;
  children?: Array<HTMLElement | string>;
  className?: string;
  id?: string;
}

export type Component<P extends ComponentProps = ComponentProps> = (props: P) => HTMLElement;

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
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof HTMLElement) {
      element.appendChild(child);
    }
  });
  
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
export function mount(component: Component | HTMLElement, container: HTMLElement): void {
  const element = component instanceof HTMLElement ? component : component({});
  container.innerHTML = '';
  container.appendChild(element);
}

/**
 * Updates an existing component with new props
 */
export function updateComponent<P extends ComponentProps>(
  element: HTMLElement,
  component: Component<P>,
  props: P
): HTMLElement {
  const newElement = component(props);
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
  
  if (props.children) {
    props.children.forEach(child => {
      if (typeof child === 'string') {
        fragment.appendChild(document.createTextNode(child));
      } else if (child instanceof HTMLElement) {
        fragment.appendChild(child);
      }
    });
  }
  
  return fragment as unknown as DocumentFragment;
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
