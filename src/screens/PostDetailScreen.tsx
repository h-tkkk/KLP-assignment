import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

import { PostService } from '../services/postService';
import { AuthService } from '../services/authService';
import { Post, Comment, CreateCommentData, RootStackParamList } from '../types';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../hooks/useTheme';

// 컴포넌트 imports
import CommentItem from '../components/comments/CommentItem';
import CommentInput from '../components/comments/CommentInput';
import CommentEditModal from '../components/comments/CommentEditModal';
import UserAvatar from '../components/UserAvatar';

type PostDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PostDetail'>;
type PostDetailScreenRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;

interface Props {
  navigation: PostDetailScreenNavigationProp;
  route: PostDetailScreenRouteProp;
}

const PostDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { postId } = route.params;
  const { showError, showSuccess, showInfo } = useToast();
  const { colors } = useTheme();
  const [post, setPost] = useState<Post | null>(null);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  // 고급 댓글 기능 상태들
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const loadPost = useCallback(async () => {
    try {
      const result = await PostService.getPost(postId);
      if (result.success && result.data) {
        setPost(result.data);
      } else {
        showError(result.error || '게시물을 불러올 수 없습니다.');
        navigation.goBack();
      }
    } catch (error) {
      showError('네트워크 오류가 발생했습니다.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }, [postId, navigation]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const handleLike = async () => {
    if (!post) return;
    
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
      showInfo('좋아요를 누르려면 로그인이 필요합니다.');
      return;
    }

    try {
      const result = await PostService.toggleLike(post.id, currentUser.uid);
      if (result.success) {
        loadPost();
      } else {
        showError(result.error || '좋아요 처리에 실패했습니다.');
      }
    } catch (error) {
      showError('네트워크 오류가 발생했습니다.');
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) {
      showError('댓글 내용을 입력해주세요.');
      return;
    }

    if (!post) return;

    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
      showInfo('댓글을 작성하려면 로그인이 필요합니다.');
      return;
    }

    setIsSubmittingComment(true);

    try {
      const commentData: CreateCommentData = {
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email || '익명',
        content: comment.trim(),
      };

      const result = await PostService.addComment(post.id, commentData);

      if (result.success) {
        setComment('');
        loadPost();
      } else {
        showError(result.error || '댓글 작성에 실패했습니다.');
      }
    } catch (error) {
      showError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleEditComment = async () => {
    if (!editContent.trim() || !editingComment) return;

    try {
      const result = await PostService.updateComment(postId, editingComment, editContent.trim());
      if (result.success) {
        setEditContent('');
        setEditingComment(null);
        setShowEditModal(false);
        loadPost();
      } else {
        showError(result.error || '댓글 수정에 실패했습니다.');
      }
    } catch (error) {
      showError('네트워크 오류가 발생했습니다.');
    }
  };

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedReplies(newExpanded);
  };

  const handleDeletePost = async () => {
    if (!post) return;
    
    try {
      const result = await PostService.deletePost(post.id);
      if (result.success) {
        showSuccess('게시물이 삭제되었습니다.');
        navigation.goBack(); // 삭제 후 이전 화면으로 돌아가기
      } else {
        showError(result.error || '게시물 삭제에 실패했습니다.');
      }
    } catch (error) {
      showError('네트워크 오류가 발생했습니다.');
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ko-KR') + ' ' + 
           date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const styles = createStyles(colors);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>게시물을 불러오는 중...</Text>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>게시물을 찾을 수 없습니다.</Text>
      </SafeAreaView>
    );
  }

  const currentUser = AuthService.getCurrentUser();
  const isLiked = currentUser && post.likes.includes(currentUser.uid);
  const likeCount = post.likes.length;
  const comments = post.comments || [];
  const isMyPost = currentUser && post.authorId === currentUser.uid;

  return (
    <SafeAreaView style={styles.container}>
      {/* 커스텀 헤더 */}
      <View style={styles.customHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>게시물 상세</Text>
        <View style={styles.headerPlaceholder} />
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.keyboardView} showsVerticalScrollIndicator={false}>
          {/* 게시물 카드 */}
          <View style={styles.postCard}>
            {/* 게시물 헤더 */}
            <View style={styles.postHeader}>
              <View style={styles.authorInfo}>
                <UserAvatar 
                  photoURL={post.authorPhotoURL}
                  displayName={post.authorName}
                  size={48}
                  fontSize={16}
                />
                <View style={styles.authorDetails}>
                  <Text style={styles.authorName}>{post.authorName}</Text>
                  <Text style={styles.postDate}>{formatDate(post.createdAt)}</Text>
                </View>

                {/* 내 게시물일 때 삭제 버튼 */}
              {isMyPost && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDeletePost}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              )}
              </View>
              
            </View>

            {/* 게시물 내용 */}
            <View style={styles.postContent}>
              <Text style={styles.postTitle}>{post.title}</Text>
              <Text style={styles.postText}>{post.content}</Text>

              {post.imageUrl && (
                <Image 
                  source={{ uri: post.imageUrl }} 
                  style={styles.postImage}
                  resizeMode="cover"
                />
              )}

              {/* 게시물 액션 */}
              <View style={styles.postActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleLike}
                >
                  <Text style={isLiked ? styles.likedText : styles.actionText}>
                    ❤️ {likeCount}
                  </Text>
                </TouchableOpacity>

                <View style={styles.actionButton}>
                  <Text style={styles.actionText}>💬 {comments.length}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 댓글 섹션 */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              댓글 ({comments.length})
            </Text>

            {comments.map((commentItem: Comment, index: number) => (
              <CommentItem
                key={commentItem.id || index}
                comment={commentItem}
                postId={postId}
                isExpanded={expandedReplies.has(commentItem.id)}
                replyingTo={replyingTo}
                replyContent={replyContent}
                onToggleReplies={toggleReplies}
                onSetReplyingTo={setReplyingTo}
                onSetReplyContent={setReplyContent}
                onEditComment={(commentId, content) => {
                  setEditingComment(commentId);
                  setEditContent(content);
                  setShowEditModal(true);
                }}
                onRefresh={loadPost}
              />
            ))}

            {comments.length === 0 && (
              <View style={styles.noComments}>
                <Text style={styles.noCommentsText}>첫 번째 댓글을 작성해보세요!</Text>
              </View>
            )}
          </View>

          <View style={{height: 16}} />
        </ScrollView>

        {/* 댓글 입력 */}
        <CommentInput
          comment={comment}
          onChangeText={setComment}
          onSubmit={handleAddComment}
          isSubmitting={isSubmittingComment}
        />

        {/* 댓글 수정 모달 */}
        <CommentEditModal
          visible={showEditModal}
          editContent={editContent}
          onChangeText={setEditContent}
          onSubmit={handleEditComment}
          onCancel={() => setShowEditModal(false)}
        />
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
  postCard: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  postHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  authorDetails: {
    flex: 1,
    marginLeft: 12,
  },
  authorName: {
    fontWeight: 'bold',
    color: colors.text,
    fontSize: 16,
  },
  postDate: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff3f3',
    borderWidth: 1,
    borderColor: '#ffebee',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#f44336',
  },
  postContent: {
    padding: 20,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  postText: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  postImage: {
    width: '100%',
    height: 256,
    borderRadius: 12,
    marginBottom: 16,
  },
  postActions: {
    flexDirection: 'row',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  likedText: {
    fontSize: 16,
    color: colors.danger,
  },
  commentsSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  noComments: {
    backgroundColor: colors.card,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  noCommentsText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  // 커스텀 헤더 스타일
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    borderRadius: 6,
    minWidth: 40,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerPlaceholder: {
    width: 40, // backButton과 동일한 너비로 중앙 정렬
  },
});

export default PostDetailScreen;