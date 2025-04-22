import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextProps {
  themeMode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    // Get initial theme from localStorage or default to 'light'
    const storedTheme = localStorage.getItem('themeMode');
    return (storedTheme === 'dark' ? 'dark' : 'light');
  });

  // Effect to update localStorage when themeMode changes
  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
    // Optional: Add/remove a class on the body for global CSS targeting
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${themeMode}-theme`);
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({ themeMode, toggleTheme }), [themeMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
