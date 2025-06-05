/**
 * 0x1 JSX Transpiler
 * 
 * A high-performance JSX transpiler that converts JSX syntax to 0x1-compatible JavaScript/TypeScript.
 * This is a Node.js implementation based on an earlier personal project, modified for 0x1.
 * 
 * Example transformations:
 * <div>Hello</div> → createElement('div', null, 'Hello')
 * <Button onClick={handler}>Click</Button> → createElement(Button, {onClick: handler}, 'Click')
 */

// Constants and utility functions
const WHITESPACE = /\s/;
const ALPHA_NUMERIC = /[a-zA-Z0-9]/;
const ATTR_NAME_VALID = /[a-zA-Z0-9_\-:]/;

/**
 * Enum for JSX token types
 */
const _JSXToken = {
  TEXT: 'Text',
  OPEN_TAG: 'OpenTag',
  CLOSE_TAG: 'CloseTag',
  SELF_CLOSING_TAG: 'SelfClosingTag',
  JAVASCRIPT: 'JavaScript',
  EOF: 'EOF'
};

/**
 * JSX Node class - represents a node in the JSX tree
 */
class JSXNode {
  /**
   * @param {string} tag - The tag name of the element
   * @param {boolean} isComponent - Whether this node is a component (starts with uppercase)
   */
  constructor(tag) {
    this.tag = tag;
    this.props = [];
    this.children = [];
    this.content = null;
    this.isComponent = this.constructor.isComponent(tag);
  }

  /**
   * Determines if a tag represents a component (starts with uppercase)
   * @param {string} tag - Tag name to check
   * @returns {boolean} True if the tag represents a component
   */
  static isComponent(tag) {
    return tag.length > 0 && tag[0] === tag[0].toUpperCase();
  }

  /**
   * Add a property to this node
   * @param {string} name - Property name
   * @param {string} value - Property value
   * @param {boolean} isExpression - Whether the value is a JavaScript expression
   */
  addProp(name, value, isExpression) {
    this.props.push({ name, value, isExpression });
  }

  /**
   * Add a child node to this node
   * @param {JSXNode} child - Child node to add
   */
  addChild(child) {
    this.children.push(child);
  }
}

/**
 * JSX Transpiler class - handles the conversion of JSX to JavaScript
 */
class JSXTranspiler {
  /**
   * @param {string} source - Source JSX code to transpile
   */
  constructor(source) {
    this.source = source;
    this.pos = 0;
  }

  /**
   * Main transpile method - converts JSX source to JavaScript
   * @returns {string} Transpiled JavaScript code
   */
  transpile() {
    let output = '';
    
    while (this.pos < this.source.length) {
      if (this.peek() === '<' && !this.isInJSExpression()) {
        const node = this.parseJSXElement();
        output += this.renderNode(node);
      } else {
        output += this.advance();
      }
    }
    
    return output;
  }

  /**
   * Parse a JSX element from the source code
   * @returns {JSXNode} Parsed JSX node
   */
  parseJSXElement() {
    this.skipWhitespace();
    
    if (this.peek() !== '<') {
      throw new Error('Expected opening bracket "<"');
    }
    this.advance(); // consume '<'

    const tag = this.parseTagName();
    const node = new JSXNode(tag);

    // Parse attributes
    while (this.pos < this.source.length && this.peek() !== '>' && this.peek() !== '/') {
      this.skipWhitespace();
      if (this.peek() === '>' || this.peek() === '/') break;
      
      this.parseAttribute(node);
    }

    this.skipWhitespace();

    // Check for self-closing tag
    if (this.peek() === '/') {
      this.advance(); // consume '/'
      if (this.peek() !== '>') {
        throw new Error('Expected closing bracket ">" after "/"');
      }
      this.advance(); // consume '>'
      return node;
    }

    if (this.peek() !== '>') {
      throw new Error('Expected closing bracket ">"');
    }
    this.advance(); // consume '>'

    // Parse children until closing tag
    while (this.pos < this.source.length) {
      this.skipWhitespace();
      
      // Check for closing tag
      if (this.pos + 1 < this.source.length && 
          this.source[this.pos] === '<' && 
          this.source[this.pos + 1] === '/') {
        break;
      }
      
      // Parse child JSX element
      if (this.peek() === '<') {
        const childNode = this.parseJSXElement();
        node.addChild(childNode);
      } 
      // Parse curly brace expressions
      else if (this.peek() === '{') {
        const jsExpression = this.parseJSExpression();
        const textNode = new JSXNode('');
        textNode.content = jsExpression;
        node.addChild(textNode);
      }
      // Parse text content
      else {
        const text = this.parseText();
        if (text.trim().length > 0) {
          const textNode = new JSXNode('');
          textNode.content = text;
          node.addChild(textNode);
        }
      }
    }

    // Parse closing tag
    this.parseClosingTag(tag);
    
    return node;
  }

  /**
   * Parse a JSX tag name
   * @returns {string} The parsed tag name
   */
  parseTagName() {
    const start = this.pos;
    while (this.pos < this.source.length && 
           (ALPHA_NUMERIC.test(this.peek()) || this.peek() === '-' || this.peek() === '_')) {
      this.advance();
    }
    return this.source.substring(start, this.pos);
  }

  /**
   * Parse an attribute on a JSX tag
   * @param {JSXNode} node - Node to add the attribute to
   */
  parseAttribute(node) {
    const name = this.parseAttributeName();
    this.skipWhitespace();

    if (this.peek() !== '=') {
      // Boolean attribute
      node.addProp(name, 'true', true);
      return;
    }

    this.advance(); // consume '='
    this.skipWhitespace();

    let value;
    let isExpression = false;

    if (this.peek() === '"' || this.peek() === "'") {
      const quote = this.advance();
      const start = this.pos;
      
      while (this.pos < this.source.length && this.peek() !== quote) {
        this.advance();
      }
      
      if (this.peek() !== quote) {
        throw new Error('Unterminated string literal in attribute value');
      }
      
      value = this.source.substring(start, this.pos);
      this.advance(); // consume closing quote
    } else if (this.peek() === '{') {
      value = this.parseJSExpression();
      isExpression = true;
    } else {
      throw new Error('Invalid attribute value');
    }

    node.addProp(name, value, isExpression);
  }

  /**
   * Parse an attribute name
   * @returns {string} The parsed attribute name
   */
  parseAttributeName() {
    const start = this.pos;
    while (this.pos < this.source.length && ATTR_NAME_VALID.test(this.peek())) {
      this.advance();
    }
    return this.source.substring(start, this.pos);
  }

  /**
   * Parse a JavaScript expression within curly braces
   * @returns {string} The parsed JS expression
   */
  parseJSExpression() {
    this.advance(); // consume '{'
    const start = this.pos;
    let braceCount = 1;
    
    while (this.pos < this.source.length && braceCount > 0) {
      const char = this.advance();
      if (char === '{') braceCount++;
      else if (char === '}') braceCount--;
    }
    
    if (braceCount !== 0) {
      throw new Error('Unterminated JS expression');
    }
    
    // Return without the closing brace
    return this.source.substring(start, this.pos - 1);
  }

  /**
   * Parse text content between tags
   * @returns {string} The parsed text content
   */
  parseText() {
    const start = this.pos;
    while (this.pos < this.source.length && this.peek() !== '<' && this.peek() !== '{') {
      this.advance();
    }
    return this.source.substring(start, this.pos).trim();
  }

  /**
   * Parse a closing tag
   * @param {string} expectedTag - The expected tag name to close
   */
  parseClosingTag(expectedTag) {
    if (this.pos + 1 >= this.source.length || 
        this.source[this.pos] !== '<' || 
        this.source[this.pos + 1] !== '/') {
      throw new Error('Expected closing tag');
    }
    
    this.pos += 2; // consume '</'
    this.skipWhitespace();
    
    const start = this.pos;
    while (this.pos < this.source.length && 
           (ALPHA_NUMERIC.test(this.peek()) || this.peek() === '-' || this.peek() === '_')) {
      this.advance();
    }
    
    const tag = this.source.substring(start, this.pos);
    if (tag !== expectedTag) {
      throw new Error(`Mismatched closing tag: expected ${expectedTag}, got ${tag}`);
    }
    
    this.skipWhitespace();
    if (this.peek() !== '>') {
      throw new Error('Expected closing bracket ">" in closing tag');
    }
    this.advance(); // consume '>'
  }

  /**
   * Render a JSX node to JavaScript code
   * @param {JSXNode} node - Node to render
   * @returns {string} Rendered JavaScript code
   */
  renderNode(node) {
    if (!node.tag && node.content !== null) {
      // Text node or JS expression
      if (node.content.includes('${') || node.content.includes('}')) {
        // Likely a complex expression that needs evaluation
        return `createElement(Text, null, ${node.content})`;
      } else {
        // Simple text node
        return `'${node.content.replace(/'/g, "\\'")}'`;
      }
    }

    let output = 'createElement(';
    
    // Tag name or component reference
    if (node.isComponent) {
      output += node.tag;
    } else {
      output += `'${node.tag}'`;
    }

    // Props object
    if (node.props.length > 0) {
      output += ', {';
      for (let i = 0; i < node.props.length; i++) {
        const prop = node.props[i];
        if (i > 0) output += ', ';
        
        output += prop.name + ': ';
        
        if (prop.isExpression) {
          output += prop.value;
        } else {
          output += `'${prop.value.replace(/'/g, "\\'")}'`;
        }
      }
      output += '}';
    } else {
      output += ', null';
    }

    // Children
    if (node.children.length > 0) {
      for (const child of node.children) {
        output += ', ';
        output += this.renderNode(child);
      }
    }

    output += ')';
    return output;
  }

  /**
   * Look at the current character without advancing
   * @returns {string} Current character or empty string if at end
   */
  peek() {
    if (this.pos >= this.source.length) return '';
    return this.source[this.pos];
  }

  /**
   * Advance to the next character and return the current one
   * @returns {string} Current character
   */
  advance() {
    if (this.pos >= this.source.length) return '';
    return this.source[this.pos++];
  }

  /**
   * Skip whitespace characters
   */
  skipWhitespace() {
    while (this.pos < this.source.length && WHITESPACE.test(this.peek())) {
      this.advance();
    }
  }

  /**
   * Check if we're currently inside a JS expression
   * @returns {boolean} True if inside a JS expression
   */
  isInJSExpression() {
    let tempPos = this.pos;
    let braceCount = 0;
    
    while (tempPos > 0) {
      tempPos--;
      if (this.source[tempPos] === '}') {
        braceCount++;
      } else if (this.source[tempPos] === '{') {
        braceCount--;
      }
    }
    
    return braceCount > 0;
  }
}

module.exports = { JSXTranspiler, JSXNode };
