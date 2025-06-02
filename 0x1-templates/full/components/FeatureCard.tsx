/**
 * Reusable FeatureCard component with modern styling
 */

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: string;
  link?: string;
  className?: string;
  style?: any;
}

export function FeatureCard({ 
  title, 
  description, 
  icon = '✨', 
  link, 
  className = '',
  style 
}: FeatureCardProps) {
  const baseClasses = "card";
  const combinedClasses = className ? `${baseClasses} ${className}` : baseClasses;

  return (
    <div className={combinedClasses} style={style}>
      <div className="p-6">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-muted-foreground mb-4">{description}</p>
        {link && (
          <a href={link} className="text-primary hover:text-accent inline-flex items-center transition-colors">
            Learn more
            <span className="ml-1">→</span>
          </a>
        )}
      </div>
    </div>
  );
}
