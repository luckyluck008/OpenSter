import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext({
  theme: { mode: 'dark', accent: '#8a2be2' },
  setTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState({ mode: 'dark', accent: '#8a2be2' });

  useEffect(() => {
    (async () => {
      try {
        const storedMode = await AsyncStorage.getItem('themeMode');
        const storedAccent = await AsyncStorage.getItem('accentColor');
        setThemeState({ mode: storedMode || 'dark', accent: storedAccent || '#8a2be2' });
      } catch (e) {
        console.warn('Failed to load theme:', e);
      }
    })();
  }, []);

  const setTheme = async (newTheme) => {
    try {
      setThemeState(newTheme);
      await AsyncStorage.setItem('themeMode', newTheme.mode);
      await AsyncStorage.setItem('accentColor', newTheme.accent);
    } catch (e) {
      console.warn('Failed to save theme:', e);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
