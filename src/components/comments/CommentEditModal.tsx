import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface CommentEditModalProps {
  visible: boolean;
  editContent: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const CommentEditModal: React.FC<CommentEditModalProps> = ({
  visible,
  editContent,
  onChangeText,
  onSubmit,
  onCancel,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>댓글 수정</Text>
          <TextInput
            style={styles.textInput}
            value={editContent}
            onChangeText={onChangeText}
            multiline={true}
            maxLength={500}
            placeholder="댓글을 수정하세요..."
            placeholderTextColor={colors.placeholder}
            textAlignVertical="top"
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
              <Text style={styles.submitButtonText}>수정</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: colors.text,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    maxHeight: 128,
    fontSize: 14,
    backgroundColor: colors.inputBackground,
    color: colors.text,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CommentEditModal;