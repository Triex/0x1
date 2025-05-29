import { useEffect, useState } from '0x1';

// templates/full/lib/theme.ts
export function useTheme() {
  // In a real implementation, this would use 0x1's store
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    setTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
    
    // Toggle dark class on html element
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return {
    theme,
    toggleTheme: () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  };
}