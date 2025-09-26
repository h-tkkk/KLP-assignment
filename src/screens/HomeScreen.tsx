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

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { showError, showSuccess } = useToast();
  const { colors } = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPosts = async () => {
    try {
      const result = await PostService.getPosts();
      if (result.success && result.data) {
        setPosts(result.data);
      } else {
        showError(result.error || '게시물을 불러올 수 없습니다.');
      }
    } catch (error) {
      showError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  // 화면에 포커스될 때마다 게시물 새로고침
  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [])
  );

  // 실시간 업데이트 (선택사항)
  useEffect(() => {
    const unsubscribe = PostService.subscribeToPostUpdates((updatedPosts) => {
      setPosts(updatedPosts);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPosts();
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
        // 게시물 목록 새로고침
        loadPosts();
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
        loadPosts(); // 목록 새로고침
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
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      return `${diffMinutes}분 전`;
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
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
                e.stopPropagation(); // 게시물 클릭 이벤트 방지
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

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>게시물이 없습니다.</Text>
      <Text style={styles.emptySubText}>첫 번째 게시물을 작성해보세요!</Text>
    </View>
  );

  const styles = createStyles(colors);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>커뮤니티</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>게시물을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>커뮤니티</Text>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyComponent}
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
  listContainer: {
    padding: 15,
    flexGrow: 1,
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  likedText: {
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
});

export default HomeScreen;
