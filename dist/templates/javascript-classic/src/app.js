/**
 * 0x1 App Entry Point
 */

import { mount } from '0x1';
import { HomePage } from './pages/home.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('root');
  
  if (rootElement) {
    // Mount the home page
    mount(HomePage(), rootElement);
  }
});
