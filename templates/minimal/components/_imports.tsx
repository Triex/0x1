/**
 * 0x1 Framework Import Example
 * 
 * This file demonstrates proper imports for JSX components
 * All TSX/JSX files need to import createElement and Fragment from 0x1
 */

import { createElement, Fragment } from '0x1';

// This imports ensures TypeScript properly recognizes JSX syntax
// You can now use JSX in your component files
export const ExampleComponent = () => {
  return (
    <div>
      <h1>Example Component</h1>
      <p>This component properly imports createElement and Fragment from 0x1</p>
    </div>
  );
};
