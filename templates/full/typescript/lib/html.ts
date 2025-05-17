/**
 * Simple HTML templating utility for 0x1
 * Provides tagged template literal functionality for HTML string generation
 */

/**
 * Tagged template function that processes HTML template literals
 * @param strings - Template string array
 * @param values - Values to interpolate
 * @returns Processed HTML string
 */
export function html(strings: TemplateStringsArray, ...values: any[]): string {
  return strings.reduce((result, str, i) => {
    const value = values[i] || '';
    return result + str + value;
  }, '');
}
