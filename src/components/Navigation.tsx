import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AuthService } from '../services/authService';
import { useTheme } from '../hooks/useTheme';
import { User, RootStackParamList, AuthStackParamList, MainTabParamList } from '../types';

// 화면 컴포넌트들 (추후 생성)
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import HomeScreen from '../screens/HomeScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import MyPostsScreen from '../screens/MyPostsScreen';
import LikedPostsScreen from '../screens/LikedPostsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

// 인증 스택 네비게이션
function AuthStackNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
}

// 메인 탭 네비게이션
function MainTabNavigator() {
  const { colors } = useTheme();
  
  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
          shadowColor: colors.shadow,
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <MainTab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: '홈',
          tabBarIcon: ({ focused, color, size }) => (
            <Text style={{ fontSize: size, opacity: focused ? 1 : 0.7 }}>🏠</Text>
          ),
        }}
      />
      <MainTab.Screen 
        name="CreatePost" 
        component={CreatePostScreen}
        options={{
          tabBarLabel: '글쓰기',
          tabBarIcon: ({ focused, color, size }) => (
            <Text style={{ fontSize: size, opacity: focused ? 1 : 0.7 }}>✏️</Text>
          ),
        }}
      />
      <MainTab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: '프로필',
          tabBarIcon: ({ focused, color, size }) => (
            <Text style={{ fontSize: size, opacity: focused ? 1 : 0.7 }}>👤</Text>
          ),
        }}
      />
    </MainTab.Navigator>
  );
}

// 메인 네비게이션
export default function Navigation() {
  const { isDark, colors } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged((user) => {
      setUser(user);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  if (isLoading) {
    // 로딩 스크린 (나중에 개선 가능)
    return null;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <RootStack.Screen name="Main" component={MainTabNavigator} />
            <RootStack.Screen 
              name="PostDetail" 
              component={PostDetailScreen}
              options={{
                headerShown: false,
              }}
            />
            <RootStack.Screen 
              name="MyPosts" 
              component={MyPostsScreen}
              options={{
                headerShown: false,
              }}
            />
            <RootStack.Screen 
              name="LikedPosts" 
              component={LikedPostsScreen}
              options={{
                headerShown: false,
              }}
            />
            <RootStack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{
                headerShown: false,
              }}
            />
          </>
        ) : (
          <RootStack.Screen name="Auth" component={AuthStackNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
