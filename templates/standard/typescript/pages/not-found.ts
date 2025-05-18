/**
 * Not Found (404) page component
 */

export function NotFound(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'flex flex-col items-center justify-center py-16 text-center';
  
  // Error code
  const errorCode = document.createElement('div');
  errorCode.className = 'text-7xl font-bold text-gray-300 dark:text-gray-700 mb-4';
  errorCode.textContent = '404';
  container.appendChild(errorCode);
  
  // Title
  const title = document.createElement('h1');
  title.className = 'text-3xl font-bold text-gray-900 dark:text-white mb-2';
  title.textContent = 'Page Not Found';
  container.appendChild(title);
  
  // Description
  const description = document.createElement('p');
  description.className = 'text-xl text-gray-600 dark:text-gray-400 mb-8';
  description.textContent = 'The page you\'re looking for doesn\'t exist or has been moved.';
  container.appendChild(description);
  
  // Back button
  const backButton = document.createElement('a');
  backButton.href = '/';
  backButton.className = 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200';
  backButton.textContent = 'Go Back Home';
  backButton.onclick = (e) => {
    e.preventDefault();
    window.history.pushState(null, '', '/');
    const popStateEvent = new PopStateEvent('popstate', { state: null });
    window.dispatchEvent(popStateEvent);
  };
  container.appendChild(backButton);
  
  return container;
}
