/**
 * Reusable Card Component
 */

interface CardProps {
  title: string;
  content: string;
  link?: {
    url: string;
    text: string;
  };
  children?: any;
}

export function Card(props: CardProps): JSX.Element {
  return (
    <div className="card rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6">
      <h3 className="text-xl font-bold mb-2">{props.title}</h3>
      <p className="opacity-75 mb-4">{props.content}</p>
      {props.link && (
        <a href={props.link.url} className="text-primary hover:text-accent hover:underline inline-flex items-center">
          {props.link.text}
          <span className="ml-1">&rarr;</span>
        </a>
      )}
      {props.children}
    </div>
  );
}