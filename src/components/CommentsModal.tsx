import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, Image, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { Post } from '../types';

interface Comment {
  id: string;
  user: string;
  avatar: string;
  text: string;
  likes: number;
  time: string;
}

interface CommentsModalProps {
  visible: boolean;
  onClose: () => void;
  post: Post | null;
}

const dummyComments: Comment[] = [
  {
    id: '1',
    user: 'rahul_memes',
    avatar: 'https://i.pravatar.cc/150?img=13',
    text: 'This is amazing!',
    likes: 12,
    time: '2h'
  },
  {
    id: '2',
    user: 'sara_codes',
    avatar: 'https://i.pravatar.cc/150?img=9',
    text: 'Love it',
    likes: 8,
    time: '4h'
  },
  {
    id: '3',
    user: 'arjun_ml',
    avatar: 'https://i.pravatar.cc/150?img=14',
    text: 'Great content',
    likes: 5,
    time: '5h'
  },
];

export const CommentsModal = ({ visible, onClose, post }: CommentsModalProps) => {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>(dummyComments);

  const handleAddComment = () => {
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      user: 'you',
      avatar: 'https://i.pravatar.cc/150?img=1',
      text: commentText,
      likes: 0,
      time: 'Just now',
    };

    setComments([newComment, ...comments]);
    setCommentText('');
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.comment}>
      <Image source={{ uri: item.avatar }} style={styles.commentAvatar} />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUser}>{item.user}</Text>
          <Text style={styles.commentTime}>{item.time}</Text>
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
        <View style={styles.commentActions}>
          <TouchableOpacity style={styles.commentAction}>
            <Ionicons name="heart-outline" size={16} color={theme.colors.textLight} />
            <Text style={styles.commentLikes}>{item.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.commentReply}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.handle} />

            <View style={styles.header}>
              <Text style={styles.headerTitle}>Comments</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={comments}
              keyExtractor={item => item.id}
              renderItem={renderComment}
              contentContainerStyle={styles.commentsList}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="chatbubble-outline" size={48} color={theme.colors.textLight} />
                  <Text style={styles.emptyText}>No comments yet</Text>
                  <Text style={styles.emptySubtext}>Be the first to comment!</Text>
                </View>
              }
            />

            <View style={styles.inputContainer}>
              <Image
                source={{ uri: 'https://i.pravatar.cc/150?img=1' }}
                style={styles.inputAvatar}
              />
              <TextInput
                style={styles.input}
                placeholder="Add a comment..."
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
                onPress={handleAddComment}
                disabled={!commentText.trim()}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={commentText.trim() ? theme.colors.primary : theme.colors.textLight}
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '50%',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  commentsList: {
    padding: theme.spacing.md,
  },
  comment: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  commentContent: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  commentUser: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  commentTime: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textLight,
  },
  commentText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 18,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentLikes: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textLight,
  },
  commentReply: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textLight,
    fontWeight: theme.fontWeight.medium,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textLight,
    marginTop: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    maxHeight: 80,
    marginRight: theme.spacing.sm,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
