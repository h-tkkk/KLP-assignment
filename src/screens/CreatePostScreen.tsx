import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';

import { PostService } from '../services/postService';
import { AuthService } from '../services/authService';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../hooks/useTheme';
import { MainTabParamList, CreatePostData, ImageAsset } from '../types';

type CreatePostScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'CreatePost'>;

interface Props {
  navigation: CreatePostScreenNavigationProp;
}

const CreatePostScreen: React.FC<Props> = ({ navigation }) => {
  const { showError, showSuccess } = useToast();
  const { colors } = useTheme();
  const [postData, setPostData] = useState<CreatePostData>({
    title: '',
    content: '',
    authorId: '',
    authorName: '',
  });
  const [selectedImage, setSelectedImage] = useState<ImageAsset | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: 'title' | 'content', value: string) => {
    setPostData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const showImagePicker = () => {
    // 간단하게 갤러리만 열도록 변경
    pickImageFromLibrary();
  };

  const pickImageFromLibrary = () => {
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
        setSelectedImage({
          uri: asset.uri!,
          type: asset.type,
          fileName: asset.fileName,
          fileSize: asset.fileSize,
        });
      }
    });
  };

  const pickImageFromCamera = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };

    launchCamera(options, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setSelectedImage({
          uri: asset.uri!,
          type: asset.type,
          fileName: asset.fileName,
          fileSize: asset.fileSize,
        });
      }
    });
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  const validateForm = (): boolean => {
    if (!postData.title.trim()) {
      showError('제목을 입력해주세요.');
      return false;
    }

    if (!postData.content.trim()) {
      showError('내용을 입력해주세요.');
      return false;
    }

    if (postData.title.trim().length < 2) {
      showError('제목은 최소 2자 이상이어야 합니다.');
      return false;
    }

    if (postData.content.trim().length < 10) {
      showError('내용은 최소 10자 이상이어야 합니다.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
      showError('로그인이 필요합니다.');
      return;
    }

    setIsLoading(true);

    try {
      const completePostData: CreatePostData = {
        ...postData,
        title: postData.title.trim(),
        content: postData.content.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email || '익명',
      };

      const result = await PostService.createPost(completePostData, selectedImage || undefined);

      if (result.success) {
        // 폼 초기화
        setPostData({
          title: '',
          content: '',
          authorId: '',
          authorName: '',
        });
        setSelectedImage(null);
        
        // 성공 Toast 메시지 표시
        showSuccess('게시물이 작성되었습니다! 🎉');
        
        // 약간의 딜레이 후 홈으로 이동 (Toast를 볼 시간)
        setTimeout(() => {
          navigation.navigate('Home');
        }, 1000);
      } else {
        showError(result.error || '게시물 작성에 실패했습니다.');
      }
    } catch (error) {
      showError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>새 게시물</Text>
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>게시</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <TextInput
            style={styles.titleInput}
            placeholder="제목을 입력하세요"
            placeholderTextColor={colors.placeholder}
            value={postData.title}
            onChangeText={(value) => handleInputChange('title', value)}
            multiline={false}
            maxLength={100}
            editable={!isLoading}
          />

          <TextInput
            style={styles.contentInput}
            placeholder="내용을 입력하세요"
            placeholderTextColor={colors.placeholder}
            value={postData.content}
            onChangeText={(value) => handleInputChange('content', value)}
            multiline={true}
            textAlignVertical="top"
            maxLength={1000}
            editable={!isLoading}
          />

          {selectedImage && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
              <TouchableOpacity 
                style={styles.removeImageButton} 
                onPress={removeImage}
                disabled={isLoading}
              >
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity 
            style={styles.imageButton} 
            onPress={showImagePicker}
            disabled={isLoading}
          >
            <Text style={styles.imageButtonText}>📷 이미지 추가</Text>
          </TouchableOpacity>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              • 제목: {postData.title.length}/100자
            </Text>
            <Text style={styles.infoText}>
              • 내용: {postData.content.length}/1000자
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  titleInput: {
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    padding: 15,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  contentInput: {
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    minHeight: 200,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  selectedImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageButton: {
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginBottom: 15,
  },
  imageButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  infoContainer: {
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 5,
  },
});

export default CreatePostScreen;
