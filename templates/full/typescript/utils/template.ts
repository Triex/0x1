/**
 * HTML templating utility for 0x1
 * Provides an html tagged template literal for creating DOM elements
 */

/**
 * HTML template literal tag to create DOM elements
 */
export function html(strings: TemplateStringsArray, ...values: any[]): HTMLElement {
  // Combine the strings and values into a single HTML string
  const htmlString = strings.reduce((result, str, i) => {
    const value = values[i - 1];
    let valueStr = '';
    
    if (value === null || value === undefined) {
      valueStr = '';
    } else if (value instanceof HTMLElement || value instanceof DocumentFragment) {
      // For DOM elements, we'll insert a placeholder and replace it later
      valueStr = `<template data-placeholder="${i-1}"></template>`;
    } else {
      valueStr = String(value);
    }
    
    return result + valueStr + str;
  });
  
  // Create a temporary container
  const template = document.createElement('template');
  template.innerHTML = htmlString.trim();
  
  // Get the content as a DocumentFragment
  const content = template.content;
  
  // Replace any DOM element placeholders
  const placeholders = content.querySelectorAll('template[data-placeholder]');
  placeholders.forEach(placeholder => {
    const index = Number(placeholder.getAttribute('data-placeholder'));
    const value = values[index];
    
    if (value instanceof HTMLElement || value instanceof DocumentFragment) {
      placeholder.parentNode?.replaceChild(value, placeholder);
    }
  });
  
  // Return the first element if there's only one, otherwise return the fragment
  if (content.children.length === 1) {
    return content.firstElementChild as HTMLElement;
  }
  
  // Create a div to hold multiple elements
  const container = document.createElement('div');
  container.appendChild(content);
  return container;
}
