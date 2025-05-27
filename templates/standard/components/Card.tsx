/**
 * Reusable Card Component with Modern Styling
 */

interface CardProps {
  title?: string;
  content?: string;
  link?: {
    url: string;
    text: string;
  };
  children?: any;
  className?: string;
  style?: any;
}

export function Card(props: CardProps) {
  const baseClasses = "card";
  const combinedClasses = props.className ? `${baseClasses} ${props.className}` : baseClasses;

  return (
    <div className={combinedClasses} style={props.style}>
      {props.title && (
        <h3 className="text-xl font-bold mb-2">{props.title}</h3>
      )}
      {props.content && (
        <p className="text-muted-foreground mb-4">{props.content}</p>
      )}
      {props.link && (
        <a href={props.link.url} className="text-primary hover:text-accent inline-flex items-center transition-colors">
          {props.link.text}
          <span className="ml-1">&rarr;</span>
        </a>
      )}
      {props.children}
    </div>
  );
}