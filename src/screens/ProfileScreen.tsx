import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';

import { AuthService } from '../services/authService';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../hooks/useTheme';
import { MainTabParamList, RootStackParamList, ImageAsset } from '../types';

type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { showError, showSuccess, showInfo } = useToast();
  const { colors } = useTheme();
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    // 사용자 정보 변경 감지
    const unsubscribe = AuthService.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    return unsubscribe;
  }, []);

  // 화면에 포커스될 때마다 사용자 정보 새로고침
  useFocusEffect(
    useCallback(() => {
      setCurrentUser(AuthService.getCurrentUser());
    }, [])
  );

  const handleLogout = async () => {
    try {
      const result = await AuthService.signOut();
      if (!result.success) {
        showError(result.error || '로그아웃에 실패했습니다.');
      }
      // 성공하면 자동으로 로그인 화면으로 이동됩니다 (onAuthStateChanged)
    } catch (error) {
      showError('네트워크 오류가 발생했습니다.');
    }
  };

  const handleMenuPress = (menuName: string) => {
    switch (menuName) {
      case '내가 작성한 글':
        navigation.navigate('MyPosts');
        break;
      case '좋아요한 글':
        navigation.navigate('LikedPosts');
        break;
      case '설정':
        navigation.navigate('Settings');
        break;
      default:
        showInfo(`${menuName} 기능은 준비 중입니다.`);
        break;
    }
  };

  const handleProfileImagePress = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        const imageAsset: ImageAsset = {
          uri: asset.uri!,
          type: asset.type!,
          name: asset.fileName || 'profile.jpg',
        };

        handleUploadProfileImage(imageAsset);
      }
    });
  };

  const handleUploadProfileImage = async (imageAsset: ImageAsset) => {
    setIsUploadingImage(true);
    try {
      const result = await AuthService.updateProfileImage(imageAsset);
      if (result.success) {
        showSuccess('프로필 사진이 업데이트되었습니다!');
        // 현재 사용자 정보 새로고침
        setCurrentUser(AuthService.getCurrentUser());
      } else {
        showError(result.error || '프로필 사진 업데이트에 실패했습니다.');
      }
    } catch (error) {
      showError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const getUserInitial = (): string => {
    if (currentUser?.displayName) {
      return currentUser.displayName.charAt(0).toUpperCase();
    } else if (currentUser?.email) {
      return currentUser.email.charAt(0).toUpperCase();
    }
    return '?';
  };

  const getUserDisplayName = (): string => {
    return currentUser?.displayName || currentUser?.email || '사용자';
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>프로필</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.profileInfo}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handleProfileImagePress}
            disabled={isUploadingImage}
          >
            {currentUser?.photoURL ? (
              <Image 
                source={{ uri: currentUser.photoURL }} 
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getUserInitial()}</Text>
              </View>
            )}
            
            {isUploadingImage && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color="#fff" size="small" />
              </View>
            )}
            
            <View style={styles.editIconContainer}>
              <Text style={styles.editIcon}>📷</Text>
            </View>
          </TouchableOpacity>
          
          <Text style={styles.userName}>{getUserDisplayName()}</Text>
          <Text style={styles.userEmail}>{currentUser?.email}</Text>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => handleMenuPress('내가 작성한 글')}
          >
            <Text style={styles.menuText}>내가 작성한 글</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => handleMenuPress('좋아요한 글')}
          >
            <Text style={styles.menuText}>좋아요한 글</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => handleMenuPress('설정')}
          >
            <Text style={styles.menuText}>설정</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => handleMenuPress('도움말')}
          >
            <Text style={styles.menuText}>도움말</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>앱 정보</Text>
          <Text style={styles.infoText}>버전: 1.0.0</Text>
          <Text style={styles.infoText}>React Native + Firebase</Text>
          <Text style={styles.infoText}>커뮤니티 앱 MVP</Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileInfo: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  editIcon: {
    fontSize: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  editHint: {
    fontSize: 12,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  menuSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuText: {
    fontSize: 16,
    color: colors.text,
  },
  menuArrow: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  infoSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  logoutButton: {
    backgroundColor: colors.danger,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
