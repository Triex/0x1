/**
 * Home Page Component
 */

import { createElement } from 'bundl';
import { Footer } from '../components/Footer.js';
import { Header } from '../components/Header.js';

export function HomePage() {
  return createElement('div', {
    className: 'page home-page',
    children: [
      Header({
        title: 'Welcome to 0x1'
      }),
      
      createElement('main', {
        className: 'main-content',
        children: [
          createElement('div', {
            className: 'container mx-auto py-8',
            children: [
              createElement('section', {
                className: 'hero text-center py-16',
                children: [
                  createElement('h1', {
                    className: 'text-4xl font-bold mb-4',
                    children: ['0x1 Framework']
                  }),
                  createElement('p', {
                    className: 'text-xl mb-8 text-gray-600',
                    children: ['The ultra-minimal JavaScript framework with extreme performance']
                  }),
                  createElement('div', {
                    className: 'flex justify-center gap-4',
                    children: [
                      createElement('a', {
                        href: 'https://github.com/Triex/0x1',
                        className: 'btn primary',
                        children: ['GitHub']
                      }),
                      createElement('a', {
                        href: '#features',
                        className: 'btn secondary',
                        children: ['Learn More']
                      })
                    ]
                  })
                ]
              }),
              
              createElement('section', {
                id: 'features',
                className: 'features py-16',
                children: [
                  createElement('h2', {
                    className: 'text-3xl font-bold mb-8 text-center',
                    children: ['Features']
                  }),
                  createElement('div', {
                    className: 'grid grid-cols-1 md:grid-cols-3 gap-8',
                    children: [
                      FeatureCard({
                        title: 'Extreme Performance',
                        description: 'Tiny runtime with zero hydration cost and <10kb JS payload.'
                      }),
                      FeatureCard({
                        title: 'Simple API',
                        description: 'Minimal abstraction, near-vanilla JS performance.'
                      }),
                      FeatureCard({
                        title: 'Built with Bun',
                        description: 'Leverages Bun for the fastest development experience.'
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }),
      
      Footer()
    ]
  });
}

function FeatureCard({ title, description }) {
  return createElement('div', {
    className: 'feature-card p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow',
    children: [
      createElement('h3', {
        className: 'text-xl font-bold mb-2',
        children: [title]
      }),
      createElement('p', {
        className: 'text-gray-600',
        children: [description]
      })
    ]
  });
}
