/**
 * Card component for displaying content in a boxed layout
 */

export function Card(props) {
  const card = document.createElement('div');
  card.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-gray-200 dark:border-gray-700';
  
  // Icon
  if (props.icon) {
    const iconContainer = document.createElement('div');
    iconContainer.className = 'text-3xl mb-4';
    iconContainer.textContent = props.icon;
    card.appendChild(iconContainer);
  }
  
  // Title
  const title = document.createElement('h3');
  title.className = 'text-xl font-bold mb-2 text-gray-900 dark:text-white';
  title.textContent = props.title;
  card.appendChild(title);
  
  // Content
  const content = document.createElement('p');
  content.className = 'text-gray-600 dark:text-gray-300 mb-4';
  content.textContent = props.content;
  card.appendChild(content);
  
  // Link (optional)
  if (props.link) {
    const link = document.createElement('a');
    link.href = props.link.url;
    link.className = 'text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center';
    link.textContent = props.link.text;
    
    // Add arrow icon
    const arrow = document.createElement('span');
    arrow.className = 'ml-1';
    arrow.innerHTML = '&rarr;';
    link.appendChild(arrow);
    
    card.appendChild(link);
  }
  
  return card;
}
