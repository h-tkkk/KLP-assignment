/**
 * 커뮤니티 앱 MVP
 * React Native + Firebase + TypeScript
 *
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Navigation from './src/components/Navigation';
import { ToastProvider } from './src/hooks/useToast';
import { ThemeProvider, useTheme } from './src/hooks/useTheme';

const AppContent: React.FC = () => {
  const { isDark, colors } = useTheme();
  
  return (
    <>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={colors.statusBar} 
      />
      <Navigation />
    </>
  );
};

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
