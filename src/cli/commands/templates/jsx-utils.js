/**
 * Shared utility functions for JSX handling
 * Used across the framework for consistent JSX transformation
 */

/**
 * Filter out boolean values from JSX outputs
 * 
 * @param {any} item - The item to check
 * @returns {any} The item if it's not a boolean, null otherwise
 */
function filterBooleanValues(item) {
  // Remove true/false values from rendering
  if (item === true || item === false) return null;
  
  // Handle arrays recursively
  if (Array.isArray(item)) {
    return item
      .map(filterBooleanValues)
      .filter(i => i !== null && i !== undefined);
  }
  
  return item;
}

/**
 * Check if content has a full HTML structure (with html, head, body tags)
 * Used to detect Next.js 15-style layouts
 * 
 * @param {any} content - The content to check
 * @returns {boolean} True if content has HTML structure
 */
function hasHtmlStructure(content) {
  if (typeof content === 'string') {
    // Check for HTML tags in string content
    return content.includes('<html') || 
           content.includes('</html>') || 
           (content.includes('<head') && content.includes('<body'));
  }
  
  // Check for React/JSX component structure
  if (content && typeof content === 'object') {
    // Check if type is html
    if (content.type === 'html') return true;
    
    // Check for children that might be head/body
    if (content.props && Array.isArray(content.props.children)) {
      return content.props.children.some(child => 
        child && (child.type === 'head' || child.type === 'body')
      );
    }
  }
  
  return false;
}

/**
 * Extract body content from HTML structure
 * 
 * @param {any} htmlContent - HTML content with full structure
 * @returns {any} The extracted body content
 */
function extractBodyContent(htmlContent) {
  if (typeof htmlContent === 'string') {
    // Extract body content from string HTML
    const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    return bodyMatch ? bodyMatch[1] : htmlContent;
  }
  
  // Extract from React/JSX component
  if (htmlContent && typeof htmlContent === 'object') {
    if (htmlContent.props && htmlContent.props.children) {
      // Find body element in children
      const bodyElement = Array.isArray(htmlContent.props.children) ?
        htmlContent.props.children.find(child => 
          child && child.type === 'body'
        ) : null;
      
      return bodyElement ? bodyElement.props.children : htmlContent;
    }
  }
  
  return htmlContent;
}

// Export utilities for use in other modules
module.exports = {
  filterBooleanValues,
  hasHtmlStructure,
  extractBodyContent
};
