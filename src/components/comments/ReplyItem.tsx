import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Reply } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import UserAvatar from '../UserAvatar';

interface ReplyItemProps {
  reply: Reply;
}

const ReplyItem: React.FC<ReplyItemProps> = ({ reply }) => {
  const { colors } = useTheme();
  
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
    <View style={styles.container}>
      <View style={styles.header}>
        <UserAvatar 
          photoURL={reply.authorPhotoURL}
          displayName={reply.authorName}
          size={24}
          fontSize={10}
        />
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{reply.authorName}</Text>
          <Text style={styles.date}>
            {formatDate(reply.createdAt)}
            {reply.isEdited && ' (수정됨)'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.content}>{reply.content}</Text>
      
      <TouchableOpacity style={styles.likeButton}>
        <Text style={styles.likeText}>
          ❤️ {(reply.likes || []).length}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    marginLeft: 40,
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 10,
  },
  authorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  authorName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  date: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  content: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 16,
    marginBottom: 8,
  },
  likeButton: {
    alignSelf: 'flex-start',
  },
  likeText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});

export default ReplyItem;
