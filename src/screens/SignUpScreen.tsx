import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AuthService } from '../services/authService';
import { useToast } from '../hooks/useToast';
import { AuthStackParamList, SignUpData } from '../types';

type SignUpScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

interface Props {
  navigation: SignUpScreenNavigationProp;
}

const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  const { showError, showSuccess } = useToast();
  const [signUpData, setSignUpData] = useState<SignUpData>({
    email: '',
    password: '',
    displayName: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof SignUpData, value: string) => {
    setSignUpData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    const { email, password, displayName, confirmPassword } = signUpData;

    if (!email.trim()) {
      showError('이메일을 입력해주세요.');
      return false;
    }

    if (!displayName.trim()) {
      showError('이름을 입력해주세요.');
      return false;
    }

    if (!password.trim()) {
      showError('비밀번호를 입력해주세요.');
      return false;
    }

    if (!confirmPassword.trim()) {
      showError('비밀번호 확인을 입력해주세요.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('올바른 이메일 형식을 입력해주세요.');
      return false;
    }

    if (password.length < 6) {
      showError('비밀번호는 최소 6자 이상이어야 합니다.');
      return false;
    }

    if (password !== confirmPassword) {
      showError('비밀번호가 일치하지 않습니다.');
      return false;
    }

    if (displayName.length < 2) {
      showError('이름은 최소 2자 이상이어야 합니다.');
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const result = await AuthService.signUp(signUpData);
      
      if (result.success) {
        showSuccess('회원가입이 완료되었습니다! 🎉');
        // 네비게이션은 자동으로 처리됩니다 (onAuthStateChanged)
      } else {
        showError(result.error || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      showError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>회원가입</Text>
              <Text style={styles.subtitle}>새 계정을 만들어보세요</Text>
            </View>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="이름"
                value={signUpData.displayName}
                onChangeText={(value) => handleInputChange('displayName', value)}
                autoCapitalize="words"
                editable={!isLoading}
              />

              <TextInput
                style={styles.input}
                placeholder="이메일 (중복 불가)"
                value={signUpData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />

              <TextInput
                style={styles.input}
                placeholder="비밀번호 (최소 6자)"
                value={signUpData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />

              <TextInput
                style={styles.input}
                placeholder="비밀번호 확인"
                value={signUpData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />

              <TouchableOpacity
                style={[styles.signUpButton, isLoading && styles.buttonDisabled]}
                onPress={handleSignUp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.signUpButtonText}>회원가입</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={navigateToLogin}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>
                  이미 계정이 있으신가요? 로그인
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    gap: 15,
  },
  input: {
    height: 50,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
  },
  signUpButton: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButton: {
    paddingVertical: 15,
  },
  loginButtonText: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: 14,
  },
});

export default SignUpScreen;
