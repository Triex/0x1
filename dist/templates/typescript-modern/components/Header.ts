/**
 * Header Component
 */

import { createElement } from 'bundl';
import { NavLink } from './NavLink';

export interface HeaderProps {
  title?: string;
}

export function Header({ title = '0x1 App' }: HeaderProps): HTMLElement {
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
                  NavLink({ label: 'Home', href: '/' }),
                  NavLink({ label: 'About', href: '/about' }),
                  NavLink({ label: 'Docs', href: '/docs' }),
                  NavLink({ 
                    label: 'GitHub', 
                    href: 'https://github.com/Triex/0x1', 
                    external: true 
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
