import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../types';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';

interface PostCardProps {
  post: Post;
  onPress?: () => void;
  onCommentPress?: () => void;
}

export const PostCard = ({ post, onPress, onCommentPress }: PostCardProps) => {
  const { likePost } = useApp();

  const formatTime = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return `${Math.floor((Date.now() - date.getTime()) / (1000 * 60))}m`;
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.95}>
      <View style={styles.header}>
        <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={styles.username}>{post.user.username}</Text>
          <Text style={styles.college}>
            {post.user.college} • {formatTime(post.createdAt)}
          </Text>
        </View>
      </View>

      <Image source={{ uri: post.image }} style={styles.postImage} />

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => likePost(post.id)}>
          <Ionicons
            name={post.isLiked ? 'heart' : 'heart-outline'}
            size={24}
            color={post.isLiked ? theme.colors.error : theme.colors.text}
          />
          <Text style={styles.actionText}>{post.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            onCommentPress?.();
          }}
        >
          <Ionicons name="chatbubble-outline" size={22} color={theme.colors.text} />
          <Text style={styles.actionText}>{post.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-social-outline" size={22} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.caption}>
        <Text style={styles.captionText} numberOfLines={2}>
          <Text style={styles.captionUsername}>{post.user.username}</Text> {post.caption}
        </Text>
        <Text style={styles.hashtags}>{post.hashtags.join(' ')}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userInfo: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  username: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  college: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  postImage: {
    width: '100%',
    height: 300,
    backgroundColor: theme.colors.backgroundLight,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  actionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  caption: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  captionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 20,
  },
  captionUsername: {
    fontWeight: theme.fontWeight.semibold,
  },
  hashtags: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
  },
});
