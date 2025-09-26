import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Comment } from '../../types';
import { AuthService } from '../../services/authService';
import { PostService } from '../../services/postService';
import { useToast } from '../../hooks/useToast';
import { useTheme } from '../../hooks/useTheme';
import UserAvatar from '../UserAvatar';
import ReplyItem from './ReplyItem';
import ReplyInput from './ReplyInput';

interface CommentItemProps {
  comment: Comment;
  postId: string;
  isExpanded: boolean;
  replyingTo: string | null;
  replyContent: string;
  onToggleReplies: (commentId: string) => void;
  onSetReplyingTo: (commentId: string | null) => void;
  onSetReplyContent: (content: string) => void;
  onEditComment: (commentId: string, content: string) => void;
  onRefresh: () => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  postId,
  isExpanded,
  replyingTo,
  replyContent,
  onToggleReplies,
  onSetReplyingTo,
  onSetReplyContent,
  onEditComment,
  onRefresh,
}) => {
  const { showError, showSuccess } = useToast();
  const { colors } = useTheme();
  const user = AuthService.getCurrentUser();
  const isMyComment = user && comment.authorId === user.uid;
  const commentLikes = comment.likes || [];
  const isCommentLiked = user && commentLikes.includes(user.uid);
  const replies = comment.replies || [];

  const handleCommentLike = async () => {
    if (!user) return;
    try {
      const result = await PostService.toggleCommentLike(postId, comment.id, user.uid);
      if (result.success) {
        onRefresh();
      }
    } catch (error) {
      showError('댓글 좋아요 처리에 실패했습니다.');
    }
  };

  const handleDeleteComment = async () => {
    try {
      const result = await PostService.deleteComment(postId, comment.id);
      if (result.success) {
        onRefresh();
        showSuccess('댓글이 삭제되었습니다.');
      } else {
        showError(result.error || '댓글 삭제에 실패했습니다.');
      }
    } catch (error) {
      showError('네트워크 오류가 발생했습니다.');
    }
  };

  const handleAddReply = async () => {
    if (!replyContent.trim()) {
      showError('대댓글 내용을 입력해주세요.');
      return;
    }

    if (!user) return;

    try {
      const replyData = {
        authorId: user.uid,
        authorName: user.displayName || user.email || '익명',
        content: replyContent.trim(),
      };

      const result = await PostService.addReply(postId, comment.id, replyData);
      if (result.success) {
        onSetReplyContent('');
        onSetReplyingTo(null);
        onRefresh();
      } else {
        showError(result.error || '대댓글 작성에 실패했습니다.');
      }
    } catch (error) {
      showError('네트워크 오류가 발생했습니다.');
    }
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      return diffMinutes < 1 ? '방금 전' : `${diffMinutes}분 전`;
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.commentContainer}>
      {/* 댓글 헤더 */}
      <View style={styles.commentHeader}>
        <View style={styles.authorSection}>
          <UserAvatar 
            photoURL={comment.authorPhotoURL}
            displayName={comment.authorName}
            size={32}
            fontSize={12}
          />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{comment.authorName}</Text>
            <Text style={styles.commentDate}>
              {formatDate(comment.createdAt)}
              {comment.isEdited && ' (수정됨)'}
            </Text>
          </View>
        </View>
        
        {/* 내 댓글일 때 수정/삭제 버튼 */}
        {isMyComment && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => onEditComment(comment.id, comment.content)}
            >
              <Text style={styles.editButtonText}>수정</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteComment}
            >
              <Text style={styles.deleteButtonText}>삭제</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 댓글 내용 */}
      <Text style={styles.commentContent}>{comment.content}</Text>

      {/* 댓글 액션 바 */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleCommentLike}
        >
          <Text style={isCommentLiked ? styles.likedText : styles.actionText}>
            ❤️ {commentLikes.length}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onSetReplyingTo(replyingTo === comment.id ? null : comment.id)}
        >
          <Text style={styles.replyText}>💬 답글</Text>
        </TouchableOpacity>

        {replies.length > 0 && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onToggleReplies(comment.id)}
          >
            <Text style={styles.actionText}>
              {isExpanded ? '▲' : '▼'} 답글 {replies.length}개
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 대댓글 입력 */}
      {replyingTo === comment.id && (
        <ReplyInput
          replyContent={replyContent}
          onChangeText={onSetReplyContent}
          onSubmit={handleAddReply}
          onCancel={() => onSetReplyingTo(null)}
        />
      )}

      {/* 대댓글 목록 */}
      {isExpanded && replies.map((reply, index) => (
        <ReplyItem key={reply.id || index} reply={reply} />
      ))}
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  commentContainer: {
    backgroundColor: colors.card,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  authorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  commentDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.inputBackground,
    borderRadius: 6,
  },
  editButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.inputBackground,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  commentContent: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionBar: {
    flexDirection: 'row',
    backgroundColor: colors.inputBackground,
    padding: 12,
    borderRadius: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: colors.surface,
    borderRadius: 20,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  likedText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.danger,
  },
  replyText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
});

export default CommentItem;
