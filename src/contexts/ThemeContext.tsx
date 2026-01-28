import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeColor = 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'cyan';

interface ThemeContextValue {
  color: ThemeColor;
  setColor: (color: ThemeColor) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'hotel-ms-theme-color';

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Color palette for different theme colors
 */
export const themeColors: Record<ThemeColor, string> = {
  blue: '#1890ff',
  green: '#52c41a',
  purple: '#722ed1',
  red: '#f5222d',
  orange: '#fa8c16',
  cyan: '#13c2c2',
};

/**
 * ThemeProvider component
 * Manages theme color with persistence to localStorage
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [color, setColorState] = useState<ThemeColor>(() => {
    // Load theme color from localStorage on initialization
    const savedColor = localStorage.getItem(THEME_STORAGE_KEY);
    return (savedColor as ThemeColor) || 'blue';
  });

  // Persist theme color to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, color);
  }, [color]);

  const setColor = (newColor: ThemeColor) => {
    setColorState(newColor);
  };

  return (
    <ThemeContext.Provider value={{ color, setColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Custom hook to access theme context
 * @throws Error if used outside ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
