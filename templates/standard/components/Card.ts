/**
 * Card component for displaying content in a boxed layout
 */
interface CardProps {
  title: string;
  content: string;
  link?: {
    text: string;
    url: string;
  };
}

export function Card(props: CardProps): HTMLElement {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-100 dark:border-gray-700">
      <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{props.title}</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4">{props.content}</p>
      {props.link && (
        <a href={props.link.url} className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center">
          {props.link.text}
          <span className="ml-1">&rarr;</span>
        </a>
      )}
    </div>
  );
}