/**
 * About page component
 */

export function About() {
  const container = document.createElement('div');
  container.className = 'max-w-3xl mx-auto';
  
  // Page header
  const header = document.createElement('header');
  header.className = 'mb-12 border-b pb-8 border-gray-200 dark:border-gray-700';
  container.appendChild(header);
  
  const title = document.createElement('h1');
  title.className = 'text-4xl font-bold text-gray-900 dark:text-white mb-4';
  title.textContent = 'About 0x1';
  header.appendChild(title);
  
  const subtitle = document.createElement('p');
  subtitle.className = 'text-xl text-gray-600 dark:text-gray-300';
  subtitle.textContent = 'The ultra-minimal JavaScript framework with extreme performance';
  header.appendChild(subtitle);
  
  // Main content
  const content = document.createElement('div');
  content.className = 'space-y-8 prose dark:prose-invert max-w-none';
  container.appendChild(content);
  
  // Section: What is 0x1?
  const section1 = document.createElement('section');
  content.appendChild(section1);
  
  const section1Title = document.createElement('h2');
  section1Title.textContent = 'What is 0x1?';
  section1.appendChild(section1Title);
  
  const section1Content = document.createElement('p');
  section1Content.textContent = '0x1 is a modern web framework built on the Bun JavaScript runtime. It focuses on performance and developer experience, providing a minimal yet powerful foundation for building web applications.';
  section1.appendChild(section1Content);
  
  const section1List = document.createElement('ul');
  ['Zero-dependency router', 'Component system', 'Modern JavaScript', 'Extreme performance', 'Native ESM'].forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    section1List.appendChild(li);
  });
  section1.appendChild(section1List);
  
  // Section: Why 0x1?
  const section2 = document.createElement('section');
  content.appendChild(section2);
  
  const section2Title = document.createElement('h2');
  section2Title.textContent = 'Why use 0x1?';
  section2.appendChild(section2Title);
  
  const section2Content = document.createElement('p');
  section2Content.textContent = '0x1 takes a different approach from most modern frameworks:';
  section2.appendChild(section2Content);
  
  const section2List = document.createElement('ol');
  [
    'Zero abstraction cost: No virtual DOM or complex state tracking',
    'Browser-native: Leverage what browsers are good at',
    'Minimal but complete: You get exactly what you need',
    'No dependencies: Entire framework in one tiny package',
    'Extreme performance: Loaded page performance, not DX shortcuts'
  ].forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    section2List.appendChild(li);
  });
  section2.appendChild(section2List);
  
  // Team section
  const section3 = document.createElement('section');
  content.appendChild(section3);
  
  const section3Title = document.createElement('h2');
  section3Title.textContent = 'Our Team';
  section3.appendChild(section3Title);
  
  const section3Content = document.createElement('p');
  section3Content.textContent = '0x1 is built by a team of experienced developers focused on pushing the boundaries of web performance.';
  section3.appendChild(section3Content);
  
  // Action button
  const action = document.createElement('div');
  action.className = 'mt-12 text-center';
  container.appendChild(action);
  
  const actionButton = document.createElement('a');
  actionButton.href = '/';
  actionButton.className = 'inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200';
  actionButton.textContent = 'Back to Home';
  actionButton.onclick = (e) => {
    e.preventDefault();
    window.history.pushState(null, '', '/');
    const popStateEvent = new PopStateEvent('popstate', { state: null });
    window.dispatchEvent(popStateEvent);
  };
  action.appendChild(actionButton);
  
  return container;
}
