/**
 * Feature Card Component
 * Modern interactive card with animations and hover effects
 */

import { createElement } from 'bundl';
import { useState, useEffect } from 'bundl';

export interface FeatureProps {
  title: string;
  description: string;
  icon?: string;
  link?: string;
  delay?: number; // Animation delay in ms
}

/**
 * Modern interactive feature card with animations and hover effects
 */
export function FeatureCard({ 
  title, 
  description, 
  icon, 
  link, 
  delay = 0 
}: FeatureProps): HTMLElement {
  const [isVisible, setIsVisible] = useState(false);
  
  // Animation classes that will be applied after delay
  const baseClasses = 'feature-card p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 dark:text-white transition-all duration-300';
  const animationClasses = isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4';
  const hoverClasses = 'hover:shadow-lg hover:-translate-y-1';
  
  useEffect(() => {
    // Delay the animation based on the card's position
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, []);
  
  // Create the card wrapper, either a div or an anchor if link is provided
  const cardElement = createElement(link ? 'a' : 'div', {
    className: `${baseClasses} ${hoverClasses} ${animationClasses}`,
    style: `transition-delay: ${delay}ms;`,
    ...(link && { href: link, target: '_blank', rel: 'noopener' }),
    children: [
      // Icon with animation
      icon ? createElement('div', {
        className: 'icon-container mb-4 transition-transform duration-300 group-hover:scale-110',
        children: [
          createElement('img', {
            src: icon,
            alt: `${title} icon`,
            className: 'w-12 h-12 animate-bounce-subtle'
          })
        ]
      }) : null,
      
      // Title with decorative underline
      createElement('h3', {
        className: 'text-xl font-bold mb-2 relative',
        children: [
          title,
          // Animated underline effect
          createElement('span', {
            className: 'absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300',
          })
        ]
      }),
      
      // Description with proper contrast
      createElement('p', {
        className: 'text-gray-600 dark:text-gray-300',
        children: [description]
      }),
      
      // Learn more link or action indicator if link is provided
      link ? createElement('div', {
        className: 'mt-4 text-blue-600 font-medium flex items-center',
        children: [
          'Learn more',
          createElement('svg', {
            className: 'w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300',
            viewBox: '0 0 20 20',
            fill: 'currentColor',
            innerHTML: '<path fill-rule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"></path>'
          })
        ]
      }) : null
    ].filter(Boolean) // Remove null values
  });
  
  // Add event listeners for interactive effects
  if (cardElement) {
    cardElement.addEventListener('mouseenter', () => {
      cardElement.classList.add('ring-2', 'ring-blue-600', 'ring-opacity-50');
    });
    
    cardElement.addEventListener('mouseleave', () => {
      cardElement.classList.remove('ring-2', 'ring-blue-600', 'ring-opacity-50');
    });
  }
  
  return cardElement;
}
