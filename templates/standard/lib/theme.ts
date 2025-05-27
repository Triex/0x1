import { useEffect, useState } from '0x1';

export function useTheme() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('0x1-dark-mode');
      if (saved) return saved === 'dark';
    }
    return false;
  });

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle('dark', newIsDark);
    localStorage.setItem('0x1-dark-mode', newIsDark ? 'dark' : 'light');
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return { 
    isDark, 
    theme: isDark ? 'dark' : 'light',
    toggleTheme 
  };
} 