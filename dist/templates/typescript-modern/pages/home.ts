/**
 * Home Page Component
 * Modern home page with dark mode support, animations, and responsive design
 */

import { createElement, useCallback, useEffect, useState, type Page } from 'bundl';
import { FeatureCard, type FeatureProps } from '../components/FeatureCard';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';

export interface HomePageProps {
  title?: string;
}

export const HomePage: Page<HomePageProps> = {
  title: '0x1 - Home',
  meta: {
    description: '0x1 is an ultra-minimal TypeScript framework with extreme performance',
    viewport: 'width=device-width, initial-scale=1',
    themeColor: '#0077cc',
    ogImage: '/og-image.png',
    ogTitle: '0x1 - Ultra-Minimal TypeScript Framework',
    ogDescription: '0x1 is an ultra-minimal TypeScript framework with extreme performance'  
  },

  render(props: HomePageProps = {}) {
    const { title = 'Welcome to 0x1' } = props;

    // Set up component state
    const [count, setCount] = useState<number>(0);
    const [darkMode, setDarkMode] = useState<boolean>(
      window.matchMedia?.('(prefers-color-scheme: dark)').matches || false
    );
    const [isScrolled, setIsScrolled] = useState<boolean>(false);
    
    // Handle dark mode toggle
    const toggleDarkMode = useCallback(() => {
      setDarkMode(!darkMode);
      document.documentElement.classList.toggle('dark');
      localStorage.setItem('darkMode', (!darkMode).toString());
    }, [darkMode]);
    
    // Handle scroll effects
    useEffect(() => {
      const handleScroll = () => {
        setIsScrolled(window.scrollY > 50);
      };
      
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    
    // Initialize dark mode from localStorage or system preference
    useEffect(() => {
      const savedDarkMode = localStorage.getItem('darkMode');
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      
      if (savedDarkMode !== null) {
        const isDark = savedDarkMode === 'true';
        setDarkMode(isDark);
        if (isDark) document.documentElement.classList.add('dark');
      } else if (prefersDark) {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
      }
      
      // Listen for system preference changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (localStorage.getItem('darkMode') === null) {
          setDarkMode(e.matches);
          document.documentElement.classList.toggle('dark', e.matches);
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);
    
    // Define features with icons and staggered animations
    const features: FeatureProps[] = [
      {
        title: 'Extreme Performance',
        description: 'Tiny runtime with zero hydration cost and <10kb JS payload.',
        icon: '/icons/speed.svg',
        link: 'https://github.com/Triex/0x1#performance',
        delay: 100
      },
      {
        title: 'TypeScript Support',
        description: 'Built for TypeScript with full type safety and IDE support.',
        icon: '/icons/typescript.svg',
        link: 'https://github.com/Triex/0x1#typescript',
        delay: 200
      },
      {
        title: 'Built with Bun',
        description: 'Leverages Bun for the fastest development experience.',
        icon: '/icons/bun.svg',
        link: 'https://bun.sh',
        delay: 300
      },
      {
        title: 'Modern Animations',
        description: 'Beautiful animations and transitions with minimal overhead.',
        icon: '/icons/animation.svg',
        link: 'https://github.com/Triex/0x1#animations',
        delay: 400
      },
      {
        title: 'Dark Mode',
        description: 'Full support for system and user preference dark mode.',
        icon: '/icons/dark-mode.svg',
        link: '#',
        delay: 500
      },
      {
        title: 'Zero Dependencies',
        description: 'No external dependencies for core functionality.',
        icon: '/icons/zero-deps.svg',
        link: 'https://github.com/Triex/0x1#dependencies',
        delay: 600
      }
    ];

    return createElement('div', {
      className: `page home-page ${darkMode ? 'dark' : ''}`,
      children: [
        Header({
          title: '0x1 TypeScript'
        }),
        // Dark mode toggle button
        createElement('button', {
          className: `fixed top-4 right-4 z-50 p-2 rounded-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-md transition-all duration-300`,
          onClick: toggleDarkMode,
          'aria-label': darkMode ? 'Switch to light mode' : 'Switch to dark mode',
          children: [
            createElement('svg', {
              className: 'w-5 h-5',
              viewBox: '0 0 20 20',
              fill: 'currentColor',
              innerHTML: darkMode 
                ? '<path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fill-rule="evenodd" clip-rule="evenodd"></path>'
                : '<path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>'
            })
          ]
        }),
        
        createElement('main', {
          className: 'main-content bg-gray-50 dark:bg-gray-900 dark:text-white transition-colors duration-300',
          children: [
            createElement('div', {
              className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-8',
              children: [
                createElement('section', {
                  className: 'hero text-center py-16 animate-fade-in',
                  children: [
                    createElement('div', {
                      className: 'relative mb-8',
                      children: [
                        createElement('div', {
                          className: 'absolute -top-24 left-1/2 transform -translate-x-1/2 w-64 h-64 bg-blue-500 rounded-full opacity-10 filter blur-3xl animate-pulse'
                        }),
                        createElement('h1', {
                          className: 'text-4xl sm:text-5xl md:text-6xl font-bold mb-4 relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400',
                          children: [title]
                        })
                      ]
                    }),
                    createElement('p', {
                      className: 'text-xl mb-8 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto animate-slide-up',
                      children: ['The ultra-minimal TypeScript framework with extreme performance']
                    }),
                    
                    // GitHub stars and metrics
                    createElement('div', {
                      className: 'flex flex-wrap justify-center gap-4 mb-8',
                      children: [
                        createElement('div', {
                          className: 'flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full',
                          children: [
                            createElement('span', {
                              className: 'mr-2 text-yellow-500',
                              innerHTML: '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>'
                            }),
                            'GitHub Stars: 1.5k+'
                          ]
                        }),
                        createElement('div', {
                          className: 'flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full',
                          children: [
                            createElement('span', {
                              className: 'mr-2 text-green-500',
                              innerHTML: '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>'
                            }),
                            '<10kb Runtime'
                          ]
                        }),
                        createElement('div', {
                          className: 'flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full',
                          children: [
                            createElement('span', {
                              className: 'mr-2 text-blue-500',
                              innerHTML: '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path></svg>'
                            }),
                            'May 2025'
                          ]
                        })
                      ]
                    }),
                    createElement('div', {
                      className: 'counter-demo mb-8',
                      children: [
                        createElement('p', {
                          className: 'mb-2',
                          children: [`Counter: ${count}`]
                        }),
                        createElement('button', {
                          className: 'btn primary mr-2',
                          onClick: () => setCount(count + 1),
                          children: ['Increment']
                        }),
                        createElement('button', {
                          className: 'btn secondary',
                          onClick: () => setCount(0),
                          children: ['Reset']
                        })
                      ]
                    }),
                    createElement('div', {
                      className: 'flex justify-center gap-4',
                      children: [
                        createElement('a', {
                          href: 'https://github.com/Triex/0x1',
                          className: 'btn primary',
                          target: '_blank',
                          rel: 'noopener noreferrer',
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
                      children: features.map(feature => FeatureCard(feature))
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
    console.log('HomePage mounted - lifecycle method');
  },

  onUnmount() {
    console.log('HomePage unmounted - lifecycle method');
  }
};
