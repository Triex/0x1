/**
 * Header component with navigation
 */

export function Header(): HTMLElement {
  const header = document.createElement('header');
  header.className = 'bg-white dark:bg-gray-800 shadow-sm';
  
  const navbar = document.createElement('div');
  navbar.className = 'container mx-auto px-4 py-4 flex items-center justify-between';
  header.appendChild(navbar);
  
  // Logo
  const logo = document.createElement('a');
  logo.href = '/';
  logo.className = 'text-xl font-bold text-blue-600 dark:text-blue-400';
  logo.textContent = '0x1 App';
  logo.onclick = (e) => {
    e.preventDefault();
    // This is a placeholder for router navigation
    // In real usage, you'd import the router and use it here
    window.history.pushState(null, '', '/');
    const popStateEvent = new PopStateEvent('popstate', { state: null });
    window.dispatchEvent(popStateEvent);
  };
  navbar.appendChild(logo);
  
  // Navigation
  const nav = document.createElement('nav');
  nav.className = 'flex space-x-6';
  
  const links = [
    { text: 'Home', href: '/' },
    { text: 'About', href: '/about' }
  ];
  
  links.forEach(link => {
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.text;
    a.className = 'text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors duration-200';
    
    a.onclick = (e) => {
      e.preventDefault();
      window.history.pushState(null, '', link.href);
      const popStateEvent = new PopStateEvent('popstate', { state: null });
      window.dispatchEvent(popStateEvent);
    };
    
    nav.appendChild(a);
  });
  
  navbar.appendChild(nav);
  
  return header;
}
