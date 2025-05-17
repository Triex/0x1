/**
 * Reusable FeatureCard component
 */
import { html } from '0x1';

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: string;
  link?: string;
}

export function FeatureCard({ title, description, icon = '✨', link }: FeatureCardProps) {
  const cardContent = html`
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700">
      <div class="text-3xl mb-3">${icon}</div>
      <h3 class="text-xl font-bold mb-2">${title}</h3>
      <p class="text-gray-600 dark:text-gray-300">${description}</p>
      ${link ? html`<a href="${link}" class="inline-block mt-3 text-blue-600 dark:text-blue-400 hover:underline">Learn more →</a>` : ''}
    </div>
  `;

  // If a link is provided, wrap the card in an anchor tag
  if (link) {
    return html`<a href="${link}" class="block hover:no-underline">${cardContent}</a>`;
  }

  return cardContent;
}
