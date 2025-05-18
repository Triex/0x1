/**
 * Home page component
 */

import { Card } from '../components/Card.js';

export function Home() {
  const container = document.createElement('div');
  container.className = 'space-y-8';
  
  // Hero section
  const hero = document.createElement('section');
  hero.className = 'text-center pb-12 border-b border-gray-200 dark:border-gray-700';
  container.appendChild(hero);
  
  const heroTitle = document.createElement('h1');
  heroTitle.className = 'text-4xl font-bold text-gray-900 dark:text-white mb-4';
  heroTitle.textContent = 'Welcome to 0x1 Standard';
  hero.appendChild(heroTitle);
  
  const heroSubtitle = document.createElement('p');
  heroSubtitle.className = 'text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto';
  heroSubtitle.textContent = 'A complete starter template with everything you need to build modern web applications.';
  hero.appendChild(heroSubtitle);
  
  const actionButton = document.createElement('a');
  actionButton.href = '/about';
  actionButton.className = 'inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200';
  actionButton.textContent = 'Learn More';
  actionButton.onclick = (e) => {
    e.preventDefault();
    window.history.pushState(null, '', '/about');
    const popStateEvent = new PopStateEvent('popstate', { state: null });
    window.dispatchEvent(popStateEvent);
  };
  hero.appendChild(actionButton);
  
  // Features section
  const features = document.createElement('section');
  features.className = 'py-12';
  container.appendChild(features);
  
  const featuresTitle = document.createElement('h2');
  featuresTitle.className = 'text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white';
  featuresTitle.textContent = 'Features';
  features.appendChild(featuresTitle);
  
  const featureGrid = document.createElement('div');
  featureGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8';
  features.appendChild(featureGrid);
  
  // Feature cards
  const featureItems = [
    {
      title: 'Vanilla JavaScript',
      description: 'Clean, modern JavaScript without unnecessary abstractions.',
      icon: '📝'
    },
    {
      title: 'Component System',
      description: 'Modular component architecture for building complex UIs.',
      icon: '🧩'
    },
    {
      title: 'Tailwind CSS',
      description: 'Modern utility-first CSS framework for rapid UI development.',
      icon: '🎨'
    },
    {
      title: 'Fast Router',
      description: 'Lightweight client-side routing with support for dynamic routes.',
      icon: '🔄'
    },
    {
      title: 'Dark Mode',
      description: 'Built-in dark mode support with system preference detection.',
      icon: '🌓'
    },
    {
      title: 'Bun Powered',
      description: 'Lightning fast development with Bun runtime and package manager.',
      icon: '⚡'
    }
  ];
  
  featureItems.forEach(item => {
    const card = Card({
      title: item.title,
      content: item.description,
      icon: item.icon
    });
    featureGrid.appendChild(card);
  });
  
  return container;
}
