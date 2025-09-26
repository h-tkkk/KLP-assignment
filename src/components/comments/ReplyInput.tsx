import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ReplyInputProps {
  replyContent: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const ReplyInput: React.FC<ReplyInputProps> = ({
  replyContent,
  onChangeText,
  onSubmit,
  onCancel,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.textInput}
        placeholder="답글을 입력하세요..."
        placeholderTextColor={colors.placeholder}
        value={replyContent}
        onChangeText={onChangeText}
        multiline={true}
        maxLength={300}
      />
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>취소</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={onSubmit}
        >
          <Text style={styles.submitButtonText}>답글</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    marginTop: 12,
    marginLeft: 40,
    padding: 12,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.surface,
    fontSize: 14,
    maxHeight: 64,
    color: colors.text,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '500',
  },
  submitButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ReplyInput;
