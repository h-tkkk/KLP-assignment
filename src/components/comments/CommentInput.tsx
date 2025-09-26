import React from 'react';
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface CommentInputProps {
  comment: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const CommentInput: React.FC<CommentInputProps> = ({
  comment,
  onChangeText,
  onSubmit,
  isSubmitting,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  
  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          placeholder="댓글을 입력하세요..."
          placeholderTextColor={colors.placeholder}
          value={comment}
          onChangeText={onChangeText}
          multiline={true}
          maxLength={500}
          editable={!isSubmitting}
        />
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>등록</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 80,
    fontSize: 14,
    backgroundColor: colors.inputBackground,
    color: colors.text,
  },
  submitButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default CommentInput;