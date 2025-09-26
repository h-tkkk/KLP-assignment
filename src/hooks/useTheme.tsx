import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 테마 타입 정의
export type Theme = 'light' | 'dark';

// 색상 정의
export const colors = {
  light: {
    // 기본 배경
    background: '#f5f5f5',
    surface: '#ffffff',
    
    // 텍스트
    text: '#333333',
    textSecondary: '#666666',
    textTertiary: '#999999',
    
    // 테두리
    border: '#e0e0e0',
    borderLight: '#f0f0f0',
    
    // 주요 색상
    primary: '#007AFF',
    danger: '#FF3B30',
    success: '#4CAF50',
    warning: '#FFC107',
    
    // 입력 필드
    inputBackground: '#f9f9f9',
    placeholder: '#999999',
    
    // 그림자
    shadow: '#000000',
    
    // 카드
    card: '#ffffff',
    cardShadow: 'rgba(0, 0, 0, 0.1)',
    
    // 상태바
    statusBar: '#f5f5f5',
  },
  dark: {
    // 기본 배경
    background: '#121212',
    surface: '#1e1e1e',
    
    // 텍스트
    text: '#ffffff',
    textSecondary: '#cccccc',
    textTertiary: '#999999',
    
    // 테두리
    border: '#333333',
    borderLight: '#2a2a2a',
    
    // 주요 색상
    primary: '#0A84FF',
    danger: '#FF453A',
    success: '#32D74B',
    warning: '#FFD60A',
    
    // 입력 필드
    inputBackground: '#2a2a2a',
    placeholder: '#999999',
    
    // 그림자
    shadow: '#000000',
    
    // 카드
    card: '#1e1e1e',
    cardShadow: 'rgba(0, 0, 0, 0.3)',
    
    // 상태바
    statusBar: '#121212',
  },
};

// 컨텍스트 타입
interface ThemeContextType {
  theme: Theme;
  colors: typeof colors.light;
  toggleTheme: () => void;
  isDark: boolean;
}

// 컨텍스트 생성
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 테마 저장 키
const THEME_STORAGE_KEY = '@app_theme';

// ThemeProvider 컴포넌트
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');

  // 앱 시작 시 저장된 테마 불러오기
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.error('테마 불러오기 실패:', error);
    }
  };

  const saveTheme = async (newTheme: Theme) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('테마 저장 실패:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    saveTheme(newTheme);
  };

  const contextValue: ThemeContextType = {
    theme,
    colors: colors[theme],
    toggleTheme,
    isDark: theme === 'dark',
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// useTheme 훅
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
