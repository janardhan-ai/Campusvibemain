import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Note } from '../types';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';

interface NoteCardProps {
  note: Note;
  onPress?: () => void;
}

export const NoteCard = ({ note, onPress }: NoteCardProps) => {
  const { likeNote, saveNote } = useApp();

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Image source={{ uri: note.user.avatar }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={styles.title} numberOfLines={1}>
            {note.title}
          </Text>
          <Text style={styles.userDetails}>
            {note.user.name} • {note.user.college} • Year {note.user.year}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{note.resourceType.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.subject}>{note.subject}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {note.description}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => likeNote(note.id)}>
          <Ionicons
            name={note.isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={note.isLiked ? theme.colors.error : theme.colors.textMuted}
          />
          <Text style={styles.actionText}>{note.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => saveNote(note.id)}>
          <Ionicons
            name={note.isSaved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={note.isSaved ? theme.colors.primary : theme.colors.textMuted}
          />
          <Text style={styles.actionText}>{note.saves}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  userInfo: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  userDetails: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  badge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs - 2,
    borderRadius: theme.borderRadius.sm,
  },
  badgeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.white,
    fontWeight: theme.fontWeight.semibold,
  },
  subject: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  description: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    lineHeight: 18,
    marginBottom: theme.spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  actionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
});
