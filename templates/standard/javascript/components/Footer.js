/**
 * Footer component
 */

export function Footer() {
  const footer = document.createElement('footer');
  footer.className = 'bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700';
  
  const container = document.createElement('div');
  container.className = 'container mx-auto px-4 py-6';
  footer.appendChild(container);
  
  const content = document.createElement('div');
  content.className = 'flex flex-col md:flex-row justify-between items-center';
  container.appendChild(content);
  
  // Copyright
  const copyright = document.createElement('div');
  copyright.className = 'text-sm text-gray-600 dark:text-gray-400 mb-4 md:mb-0';
  copyright.innerHTML = `&copy; ${new Date().getFullYear()} 0x1 App. Built with <a href="https://bun.sh" class="text-blue-600 dark:text-blue-400 hover:underline">Bun</a>`;
  content.appendChild(copyright);
  
  // Links
  const links = document.createElement('div');
  links.className = 'flex space-x-4';
  
  const linkItems = [
    { text: 'GitHub', href: 'https://github.com' },
    { text: 'Documentation', href: '/docs' },
    { text: 'Privacy', href: '/privacy' }
  ];
  
  linkItems.forEach(item => {
    const link = document.createElement('a');
    link.href = item.href;
    link.textContent = item.text;
    link.className = 'text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200';
    links.appendChild(link);
  });
  
  content.appendChild(links);
  
  return footer;
}
