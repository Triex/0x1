/**
 * Header Component
 */

import { createElement } from '0x1';

export function Header({ title = '0x1 App' }) {
  return createElement('header', {
    className: 'header bg-white shadow-sm',
    children: [
      createElement('div', {
        className: 'container mx-auto px-4 py-4 flex justify-between items-center',
        children: [
          createElement('div', {
            className: 'logo flex items-center',
            children: [
              createElement('img', {
                src: '/favicon.svg',
                alt: '0x1 Logo',
                className: 'w-8 h-8 mr-2'
              }),
              createElement('span', {
                className: 'font-bold text-lg',
                children: [title]
              })
            ]
          }),
          createElement('nav', {
            className: 'main-nav',
            children: [
              createElement('ul', {
                className: 'flex gap-6',
                children: [
                  NavItem({ label: 'Home', href: '/' }),
                  NavItem({ label: 'About', href: '/about' }),
                  NavItem({ label: 'Docs', href: '/docs' }),
                  NavItem({ label: 'GitHub', href: 'https://github.com/Triex/0x1', external: true })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

function NavItem({ label, href, external = false }) {
  return createElement('li', {
    children: [
      createElement('a', {
        href,
        className: 'hover:text-blue-600 transition-colors',
        ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
        children: [label]
      })
    ]
  });
}
