/**
 * Reusable FeatureCard component
 */

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: string;
  link?: string;
}

export function FeatureCard({ title, description, icon = '✨', link }: FeatureCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
      {link && (
        <a href={link} className="inline-block mt-3 text-blue-600 dark:text-blue-400 hover:underline">
          Learn more →
        </a>
      )}
    </div>
  );
}
