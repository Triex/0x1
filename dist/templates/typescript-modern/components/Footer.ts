/**
 * Footer Component
 */

import { createElement } from '0x1';

export interface FooterLinkProps {
  label: string;
  href: string;
  external?: boolean;
}

function FooterLink({ label, href, external = false }: FooterLinkProps): HTMLElement {
  return createElement('li', {
    children: [
      createElement('a', {
        href,
        className: 'text-gray-600 hover:text-blue-600 transition-colors',
        ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
        children: [label]
      })
    ]
  });
}

export function Footer(): HTMLElement {
  const currentYear = new Date().getFullYear();
  
  return createElement('footer', {
    className: 'footer bg-gray-100 border-t',
    children: [
      createElement('div', {
        className: 'container mx-auto px-4 py-8',
        children: [
          createElement('div', {
            className: 'grid grid-cols-1 md:grid-cols-4 gap-8',
            children: [
              // Logo and description
              createElement('div', {
                className: 'col-span-1 md:col-span-2',
                children: [
                  createElement('div', {
                    className: 'flex items-center mb-4',
                    children: [
                      createElement('img', {
                        src: '/favicon.svg',
                        alt: '0x1 Logo',
                        className: 'w-6 h-6 mr-2'
                      }),
                      createElement('span', {
                        className: 'font-bold text-lg',
                        children: ['0x1']
                      })
                    ]
                  }),
                  createElement('p', {
                    className: 'text-gray-600 mb-4',
                    children: ['0x1 is an ultra-minimal TypeScript framework built with Bun for extreme performance.']
                  }),
                  createElement('p', {
                    className: 'text-sm text-gray-500',
                    children: [`© ${currentYear} 0x1. Licensed under TDL v1.`]
                  })
                ]
              }),
              
              // Links section
              createElement('div', {
                className: 'col-span-1',
                children: [
                  createElement('h3', {
                    className: 'font-bold mb-4',
                    children: ['Resources']
                  }),
                  createElement('ul', {
                    className: 'space-y-2',
                    children: [
                      FooterLink({ label: 'Documentation', href: '/docs' }),
                      FooterLink({ label: 'API Reference', href: '/api' }),
                      FooterLink({ label: 'Examples', href: '/examples' }),
                      FooterLink({ label: 'GitHub', href: 'https://github.com/Triex/0x1', external: true })
                    ]
                  })
                ]
              }),
              
              // Contact section
              createElement('div', {
                className: 'col-span-1',
                children: [
                  createElement('h3', {
                    className: 'font-bold mb-4',
                    children: ['Connect']
                  }),
                  createElement('ul', {
                    className: 'space-y-2',
                    children: [
                      FooterLink({ label: 'Twitter', href: 'https://twitter.com/0x1', external: true }),
                      FooterLink({ label: 'Discord', href: 'https://discord.com/invite/0x1', external: true }),
                      FooterLink({ label: 'Contribute', href: 'https://github.com/Triex/0x1/contribute', external: true })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}
