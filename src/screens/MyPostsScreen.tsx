import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { PostService } from '../services/postService';
import { AuthService } from '../services/authService';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../hooks/useTheme';
import { Post, MainTabParamList, RootStackParamList } from '../types';
import UserAvatar from '../components/UserAvatar';

const { width } = Dimensions.get('window');

type MyPostsScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<RootStackParamList, 'MyPosts'>,
  BottomTabNavigationProp<MainTabParamList>
>;

interface Props {
  navigation: MyPostsScreenNavigationProp;
}

const MyPostsScreen: React.FC<Props> = ({ navigation }) => {
  const { showError, showSuccess } = useToast();
  const { colors } = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMyPosts = async () => {
    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) {
        showError('로그인이 필요합니다.');
        navigation.goBack();
        return;
      }

      const result = await PostService.getMyPosts(currentUser.uid);
      if (result.success && result.data) {
        setPosts(result.data);
      } else {
        showError(result.error || '내가 작성한 게시물을 불러올 수 없습니다.');
      }
    } catch (error) {
      showError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMyPosts();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMyPosts();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMyPosts();
    setRefreshing(false);
  }, []);

  const handleLike = async (postId: string) => {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
      showError('로그인이 필요합니다.');
      return;
    }

    try {
      const result = await PostService.toggleLike(postId, currentUser.uid);
      if (result.success) {
        loadMyPosts();
      } else {
        showError(result.error || '좋아요 처리에 실패했습니다.');
      }
    } catch (error) {
      showError('네트워크 오류가 발생했습니다.');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const result = await PostService.deletePost(postId);
      if (result.success) {
        showSuccess('게시물이 삭제되었습니다.');
        loadMyPosts();
      } else {
        showError(result.error || '게시물 삭제에 실패했습니다.');
      }
    } catch (error) {
      showError('네트워크 오류가 발생했습니다.');
    }
  };

  const navigateToPostDetail = (postId: string) => {
    navigation.navigate('PostDetail', { postId });
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return '방금 전';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}시간 전`;
    } else if (diffInMinutes < 10080) {
      return `${Math.floor(diffInMinutes / 1440)}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

  const renderPost = ({ item }: { item: Post }) => {
    const currentUser = AuthService.getCurrentUser();
    const isLiked = currentUser && item.likes.includes(currentUser.uid);
    const likeCount = item.likes.length;
    const commentCount = item.comments.length;
    const isMyPost = currentUser && item.authorId === currentUser.uid;

    return (
      <TouchableOpacity
        style={styles.postCard}
        onPress={() => navigateToPostDetail(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.postHeader}>
          <View style={styles.authorInfo}>
            <UserAvatar 
              photoURL={item.authorPhotoURL}
              displayName={item.authorName}
              size={40}
              fontSize={14}
            />
            <View style={styles.authorDetails}>
              <Text style={styles.authorName}>{item.authorName}</Text>
              <Text style={styles.postDate}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>
          
          {/* 내 게시물일 때 삭제 버튼 */}
          {isMyPost && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(e) => {
                e.stopPropagation();
                handleDeletePost(item.id);
              }}
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postContent} numberOfLines={3}>
          {item.content}
        </Text>

        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
        )}

        <View style={styles.postFooter}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(item.id)}
          >
            <Text style={[styles.actionText, isLiked && styles.likedText]}>
              ❤️ {likeCount}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigateToPostDetail(item.id)}
          >
            <Text style={styles.actionText}>💬 {commentCount}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>아직 작성한 게시물이 없습니다</Text>
      <Text style={styles.emptySubText}>첫 번째 게시물을 작성해보세요!</Text>
      <TouchableOpacity
        style={styles.createPostButton}
        onPress={() => navigation.navigate('Main', { screen: 'CreatePost' })}
      >
        <Text style={styles.createPostButtonText}>게시물 작성하기</Text>
      </TouchableOpacity>
    </View>
  );

  const styles = createStyles(colors);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>게시물을 불러오는 중...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>내가 작성한 글</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={posts.length === 0 ? styles.emptyListContainer : styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    color: colors.textSecondary,
    fontSize: 16,
  },
  listContainer: {
    padding: 15,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: colors.textTertiary,
    marginBottom: 30,
    textAlign: 'center',
  },
  createPostButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createPostButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  postCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorDetails: {
    flex: 1,
    marginLeft: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  postDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginLeft: -36,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  deleteButtonText: {
    fontSize: 16,
    color: colors.danger,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  actionText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  likedText: {
    color: colors.danger,
    fontWeight: 'bold',
  },
});

export default MyPostsScreen;
