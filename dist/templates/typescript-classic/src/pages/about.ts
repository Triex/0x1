/**
 * About Page Component
 */

import { createElement, type Page } from '0x1';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';

export interface AboutPageProps {
  title?: string;
}

export const AboutPage: Page<AboutPageProps> = {
  title: '0x1 - About',
  meta: {
    description: 'Learn about 0x1 - the ultra-minimal TypeScript framework'
  },

  render(props: AboutPageProps = {}) {
    const { title = 'About 0x1' } = props;

    return createElement('div', {
      className: 'page about-page',
      children: [
        Header({
          title: '0x1 TypeScript'
        }),
        
        createElement('main', {
          className: 'main-content',
          children: [
            createElement('div', {
              className: 'container mx-auto py-8',
              children: [
                createElement('h1', {
                  className: 'text-4xl font-bold mb-8 text-center',
                  children: [title]
                }),
                
                createElement('section', {
                  className: 'about-content max-w-3xl mx-auto',
                  children: [
                    createElement('h2', {
                      className: 'text-2xl font-bold mb-4',
                      children: ['What is 0x1?']
                    }),
                    createElement('p', {
                      className: 'mb-6',
                      children: [
                        '0x1 is an ultra-minimal TypeScript framework designed for extreme performance. ' +
                        'Built on top of Bun, it provides a lean alternative to heavier frameworks, ' + 
                        'focusing on delivering the best possible performance with minimal overhead.'
                      ]
                    }),
                    
                    createElement('h2', {
                      className: 'text-2xl font-bold mb-4 mt-8',
                      children: ['Key Features']
                    }),
                    createElement('ul', {
                      className: 'list-disc pl-6 mb-6 space-y-2',
                      children: [
                        createElement('li', {
                          children: ['Tiny Runtime: <10kB total JS bundle size']
                        }),
                        createElement('li', {
                          children: ['Zero Hydration Cost: No client-side hydration overhead']
                        }),
                        createElement('li', {
                          children: ['Native ESM: Browser-native module loading without bundling']
                        }),
                        createElement('li', {
                          children: ['TypeScript First: Built with and for TypeScript']
                        }),
                        createElement('li', {
                          children: ['Bun Powered: Leverages the fastest JavaScript runtime']
                        })
                      ]
                    }),
                    
                    createElement('h2', {
                      className: 'text-2xl font-bold mb-4 mt-8',
                      children: ['Why 0x1?']
                    }),
                    createElement('p', {
                      className: 'mb-6',
                      children: [
                        '0x1 was created to provide a minimalist alternative to the increasingly complex ' +
                        'ecosystem of web frameworks. It focuses on what browsers are good at, leveraging ' +
                        'native platform features rather than reimplementing them. This approach results in ' +
                        'smaller bundles, faster load times, and a more sustainable development experience.'
                      ]
                    }),
                    
                    createElement('div', {
                      className: 'mt-8 text-center',
                      children: [
                        createElement('a', {
                          href: 'https://github.com/Triex/0x1',
                          className: 'btn primary',
                          target: '_blank',
                          rel: 'noopener noreferrer',
                          children: ['View on GitHub']
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
  },

  onMount() {
    console.log('AboutPage mounted');
  },

  onUnmount() {
    console.log('AboutPage unmounted');
  }
};
