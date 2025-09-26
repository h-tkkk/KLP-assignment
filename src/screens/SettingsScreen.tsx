import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AuthService } from '../services/authService';
import { PostService } from '../services/postService';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../hooks/useTheme';
import { MainTabParamList, RootStackParamList } from '../types';

type SettingsScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<RootStackParamList, 'Settings'>,
  BottomTabNavigationProp<MainTabParamList>
>;

interface Props {
  navigation: SettingsScreenNavigationProp;
}

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { showError, showSuccess, showInfo } = useToast();
  const { theme, colors, toggleTheme, isDark } = useTheme();
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());
  
  // 설정 상태들
  const [notificationSettings, setNotificationSettings] = useState({
    comments: true,
    likes: true,
    newPosts: false,
  });
  
  const [appSettings, setAppSettings] = useState({
    autoRefresh: true,
  });

  // 모달 상태들
  const [passwordChangeModal, setPasswordChangeModal] = useState(false);
  const [profileEditModal, setProfileEditModal] = useState(false);
  const [statisticsModal, setStatisticsModal] = useState(false);
  const [accountDeleteModal, setAccountDeleteModal] = useState(false);

  // 폼 상태들
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [newDisplayName, setNewDisplayName] = useState(currentUser?.displayName || '');
  const [deletePassword, setDeletePassword] = useState('');
  const [statistics, setStatistics] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    totalReplies: 0,
  });

  // 로딩 상태들
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isLoadingStatistics, setIsLoadingStatistics] = useState(false);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  // 화면에 포커스될 때마다 사용자 정보 새로고침
  useFocusEffect(
    useCallback(() => {
      setCurrentUser(AuthService.getCurrentUser());
      setNewDisplayName(AuthService.getCurrentUser()?.displayName || '');
    }, [])
  );

  const handleNotificationToggle = (type: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
    showInfo(`${getNotificationLabel(type)} 알림이 ${!notificationSettings[type] ? '켜' : '꺼'}졌습니다.`);
  };

  const getNotificationLabel = (type: keyof typeof notificationSettings): string => {
    switch (type) {
      case 'comments': return '댓글';
      case 'likes': return '좋아요';
      case 'newPosts': return '새 게시물';
      default: return '';
    }
  };

  const handleAppSettingToggle = (type: keyof typeof appSettings) => {
    setAppSettings(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
    
    showInfo('자동 새로고침 설정이 변경되었습니다.');
  };

  const handleDarkModeToggle = () => {
    toggleTheme();
    showSuccess(`${isDark ? '라이트' : '다크'} 모드가 활성화되었습니다! ${isDark ? '☀️' : '🌙'}`);
  };

  const handleChangePassword = () => {
    setPasswordChangeModal(true);
  };

  const handleChangeEmail = () => {
    showInfo('이메일 변경 기능은 준비 중입니다.');
  };

  const handleEditProfile = () => {
    setNewDisplayName(currentUser?.displayName || '');
    setProfileEditModal(true);
  };

  const handleViewStatistics = async () => {
    if (!currentUser) return;
    
    setIsLoadingStatistics(true);
    setStatisticsModal(true);
    
    try {
      const result = await PostService.getUserStatistics(currentUser.uid);
      if (result.success && result.data) {
        setStatistics(result.data);
      } else {
        showError(result.error || '통계 정보를 불러올 수 없습니다.');
      }
    } catch (error) {
      showError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoadingStatistics(false);
    }
  };

  // 비밀번호 변경 실행
  const handlePasswordChangeSubmit = async () => {
    if (!passwordForm.currentPassword) {
      showError('현재 비밀번호를 입력해주세요.');
      return;
    }
    if (!passwordForm.newPassword) {
      showError('새 비밀번호를 입력해주세요.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showError('새 비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await AuthService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      
      if (result.success) {
        showSuccess('비밀번호가 변경되었습니다! 🎉');
        setPasswordChangeModal(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showError(result.error || '비밀번호 변경에 실패했습니다.');
      }
    } catch (error) {
      showError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // 프로필 정보 수정 실행
  const handleProfileUpdateSubmit = async () => {
    if (!newDisplayName.trim()) {
      showError('이름을 입력해주세요.');
      return;
    }
    if (newDisplayName.trim().length < 2) {
      showError('이름은 2자 이상이어야 합니다.');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const result = await AuthService.updateProfile({ displayName: newDisplayName.trim() });
      
      if (result.success) {
        showSuccess('프로필이 업데이트되었습니다! 🎉');
        setProfileEditModal(false);
        
        // 약간의 딜레이 후 사용자 정보 새로고침 (Firebase Auth 동기화를 위해)
        setTimeout(() => {
          setCurrentUser(AuthService.getCurrentUser());
        }, 500);
      } else {
        showError(result.error || '프로필 업데이트에 실패했습니다.');
      }
    } catch (error) {
      showError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '계정 삭제',
      '정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          style: 'destructive',
          onPress: () => {
            setAccountDeleteModal(true);
          }
        },
      ]
    );
  };

  // 계정 삭제 실행
  const handleAccountDeleteSubmit = async () => {
    if (!deletePassword) {
      showError('비밀번호를 입력해주세요.');
      return;
    }

    setIsDeletingAccount(true);
    try {
      const result = await AuthService.deleteAccount(deletePassword);
      
      if (result.success) {
        showSuccess('계정이 삭제되었습니다.');
        // 로그아웃은 자동으로 처리됩니다
      } else {
        showError(result.error || '계정 삭제에 실패했습니다.');
      }
    } catch (error) {
      showError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsDeletingAccount(false);
      setAccountDeleteModal(false);
      setDeletePassword('');
    }
  };

  const handlePrivacyPolicy = () => {
    showInfo('개인정보 처리방침 기능은 준비 중입니다.');
  };

  const handleTermsOfService = () => {
    showInfo('이용약관 기능은 준비 중입니다.');
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const renderMenuItem = (
    title: string, 
    subtitle?: string, 
    onPress?: () => void, 
    rightElement?: React.ReactNode,
    danger?: boolean
  ) => (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.menuItemLeft}>
        <Text style={[styles.menuTitle, danger && styles.dangerText]}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement && (
        <View style={styles.menuItemRight}>
          {rightElement}
        </View>
      )}
      {onPress && !rightElement && (
        <Text style={styles.menuArrow}>›</Text>
      )}
    </TouchableOpacity>
  );

  const renderSwitchItem = (
    title: string,
    value: boolean,
    onValueChange: () => void,
    subtitle?: string
  ) => renderMenuItem(
    title,
    subtitle,
    onValueChange,
    <Switch 
      value={value} 
      onValueChange={onValueChange}
      trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
      thumbColor={value ? '#ffffff' : '#f4f3f4'}
    />
  );

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>설정</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 계정 관리 */}
        {renderSection('계정 관리', (
          <>
            {renderMenuItem(
              '프로필 정보 수정',
              '이름 변경',
              handleEditProfile
            )}
            {renderMenuItem(
              '비밀번호 변경',
              '보안을 위해 정기적으로 변경하세요',
              handleChangePassword
            )}
            {renderMenuItem(
              '이메일 변경',
              currentUser?.email,
              handleChangeEmail
            )}
          </>
        ))}

        {/* 알림 설정 */}
        {renderSection('알림 설정', (
          <>
            {renderSwitchItem(
              '댓글 알림',
              notificationSettings.comments,
              () => handleNotificationToggle('comments'),
              '내 게시물에 댓글이 달릴 때'
            )}
            {renderSwitchItem(
              '좋아요 알림',
              notificationSettings.likes,
              () => handleNotificationToggle('likes'),
              '내 게시물에 좋아요가 눌릴 때'
            )}
            {renderSwitchItem(
              '새 게시물 알림',
              notificationSettings.newPosts,
              () => handleNotificationToggle('newPosts'),
              '새로운 게시물이 올라올 때'
            )}
          </>
        ))}

        {/* 앱 설정 */}
        {renderSection('앱 설정', (
          <>
            {renderSwitchItem(
              '다크 모드',
              isDark,
              handleDarkModeToggle,
              '어두운 테마 사용'
            )}
            {renderSwitchItem(
              '자동 새로고침',
              appSettings.autoRefresh,
              () => handleAppSettingToggle('autoRefresh'),
              '화면 전환 시 자동으로 새로고침'
            )}
          </>
        ))}

        {/* 정보 */}
        {renderSection('정보', (
          <>
            {renderMenuItem(
              '내 활동 통계',
              '작성한 글, 받은 좋아요 등',
              handleViewStatistics
            )}
            {renderMenuItem(
              '앱 버전',
              '1.0.0'
            )}
            {renderMenuItem(
              '개발자',
              'React Native + Firebase MVP'
            )}
          </>
        ))}

        {/* 개인정보 & 약관 */}
        {renderSection('개인정보 & 약관', (
          <>
            {renderMenuItem(
              '개인정보 처리방침',
              undefined,
              handlePrivacyPolicy
            )}
            {renderMenuItem(
              '이용약관',
              undefined,
              handleTermsOfService
            )}
          </>
        ))}

        {/* 위험한 작업 */}
        {renderSection('계정', (
          <>
            {renderMenuItem(
              '계정 삭제',
              '모든 데이터가 영구적으로 삭제됩니다',
              handleDeleteAccount,
              undefined,
              true
            )}
          </>
        ))}
      </ScrollView>

      {/* 비밀번호 변경 모달 */}
      <Modal
        visible={passwordChangeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPasswordChangeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>비밀번호 변경</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="현재 비밀번호"
              value={passwordForm.currentPassword}
              onChangeText={(text) => setPasswordForm(prev => ({ ...prev, currentPassword: text }))}
              secureTextEntry
              editable={!isChangingPassword}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="새 비밀번호 (6자 이상)"
              value={passwordForm.newPassword}
              onChangeText={(text) => setPasswordForm(prev => ({ ...prev, newPassword: text }))}
              secureTextEntry
              editable={!isChangingPassword}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="새 비밀번호 확인"
              value={passwordForm.confirmPassword}
              onChangeText={(text) => setPasswordForm(prev => ({ ...prev, confirmPassword: text }))}
              secureTextEntry
              editable={!isChangingPassword}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setPasswordChangeModal(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                disabled={isChangingPassword}
              >
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalSubmitButton, isChangingPassword && styles.modalButtonDisabled]}
                onPress={handlePasswordChangeSubmit}
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>변경</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 프로필 수정 모달 */}
      <Modal
        visible={profileEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setProfileEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>프로필 수정</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="이름"
              value={newDisplayName}
              onChangeText={setNewDisplayName}
              editable={!isUpdatingProfile}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setProfileEditModal(false)}
                disabled={isUpdatingProfile}
              >
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalSubmitButton, isUpdatingProfile && styles.modalButtonDisabled]}
                onPress={handleProfileUpdateSubmit}
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>저장</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 통계 모달 */}
      <Modal
        visible={statisticsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStatisticsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>내 활동 통계</Text>
            
            {isLoadingStatistics ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>통계를 불러오는 중...</Text>
              </View>
            ) : (
              <View style={styles.statisticsContainer}>
                <View style={styles.statisticsItem}>
                  <Text style={styles.statisticsNumber}>{statistics.totalPosts}</Text>
                  <Text style={styles.statisticsLabel}>작성한 글</Text>
                </View>
                <View style={styles.statisticsItem}>
                  <Text style={styles.statisticsNumber}>{statistics.totalLikes}</Text>
                  <Text style={styles.statisticsLabel}>받은 좋아요</Text>
                </View>
                <View style={styles.statisticsItem}>
                  <Text style={styles.statisticsNumber}>{statistics.totalComments}</Text>
                  <Text style={styles.statisticsLabel}>작성한 댓글</Text>
                </View>
                <View style={styles.statisticsItem}>
                  <Text style={styles.statisticsNumber}>{statistics.totalReplies}</Text>
                  <Text style={styles.statisticsLabel}>작성한 답글</Text>
                </View>
              </View>
            )}
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setStatisticsModal(false)}
            >
              <Text style={styles.modalSubmitText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 계정 삭제 모달 */}
      <Modal
        visible={accountDeleteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAccountDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>계정 삭제</Text>
            <Text style={styles.modalWarning}>
              계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.
              {'\n'}확인을 위해 비밀번호를 입력해주세요.
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="비밀번호"
              value={deletePassword}
              onChangeText={setDeletePassword}
              secureTextEntry
              editable={!isDeletingAccount}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setAccountDeleteModal(false);
                  setDeletePassword('');
                }}
                disabled={isDeletingAccount}
              >
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalDangerButton, isDeletingAccount && styles.modalButtonDisabled]}
                onPress={handleAccountDeleteSubmit}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>삭제</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 24,
    color: colors.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginLeft: 20,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuItemLeft: {
    flex: 1,
  },
  menuItemRight: {
    marginLeft: 12,
  },
  menuTitle: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '400',
  },
  menuSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 20,
    color: colors.textTertiary,
    fontWeight: '400',
  },
  dangerText: {
    color: colors.danger,
  },
  // 모달 스타일들
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: colors.text,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: colors.inputBackground,
    color: colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalDangerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
  },
  modalCloseButton: {
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    marginTop: 20,
  },
  modalButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
  modalCancelText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  modalSubmitText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  modalWarning: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  statisticsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  statisticsItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    marginBottom: 12,
  },
  statisticsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statisticsLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default SettingsScreen;
