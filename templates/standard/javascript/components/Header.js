/**
 * Header component with navigation
 */

export function Header() {
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
  
  // Theme toggle button
  const themeToggle = document.createElement('button');
  themeToggle.id = 'theme-toggle';
  themeToggle.className = 'p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors';
  themeToggle.setAttribute('aria-label', 'Toggle Theme');
  
  // Sun icon (shown in dark mode)
  const sunIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  sunIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  sunIcon.setAttribute('viewBox', '0 0 24 24');
  sunIcon.setAttribute('fill', 'currentColor');
  sunIcon.setAttribute('class', 'w-5 h-5 hidden dark:block');
  sunIcon.innerHTML = `<path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />`;
  
  // Moon icon (shown in light mode)
  const moonIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  moonIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  moonIcon.setAttribute('viewBox', '0 0 24 24');
  moonIcon.setAttribute('fill', 'currentColor');
  moonIcon.setAttribute('class', 'w-5 h-5 block dark:hidden');
  moonIcon.innerHTML = `<path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clip-rule="evenodd" />`;
  
  themeToggle.appendChild(sunIcon);
  themeToggle.appendChild(moonIcon);
  
  // Add click event listener
  themeToggle.addEventListener('click', () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  });
  
  // Add theme toggle button to the navbar
  navbar.appendChild(themeToggle);
  
  return header;
}
