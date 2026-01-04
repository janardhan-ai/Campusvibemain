import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { mockConversations, Conversation } from '../data/messages';

type Props = NativeStackScreenProps<HomeStackParamList, 'Messages'>;

export const MessagesScreen = ({ navigation }: Props) => {
  const { currentUser } = useApp();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({
      tabBarStyle: { display: 'none' },
    });

    return () => {
      parent?.setOptions({
        tabBarStyle: {
          height: 56,
          paddingBottom: 6,
          paddingTop: 6,
          display: 'flex',
        },
      });
    };
  }, [navigation]);

  useEffect(() => {
    setConversations(mockConversations);
    setLoading(false);
  }, []);

  const getOtherParticipant = (conv: Conversation) => {
    if (conv.participant1_id === currentUser?.id) {
      return {
        id: conv.participant2_id,
        name: conv.participant2_name,
        avatar: conv.participant2_avatar,
      };
    }
    return {
      id: conv.participant1_id,
      name: conv.participant1_name,
      avatar: conv.participant1_avatar,
    };
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredConversations = conversations.filter(conv => {
    const other = getOtherParticipant(conv);
    return other.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const isOnline = (userId: string) => {
    const onlineUsers = ['2', '3', '6', '9', '14'];
    return onlineUsers.includes(userId);
  };

  const getUnreadCount = (convId: string) => {
    const unreadCounts: { [key: string]: number } = {
      '1': 2,
      '3': 1,
      '5': 3,
      '8': 1,
    };
    return unreadCounts[convId] || 0;
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const other = getOtherParticipant(item);
    const online = isOnline(other.id);
    const unreadCount = getUnreadCount(item.id);

    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() => navigation.navigate('ChatDetail', {
          userId: other.id,
          userName: other.name,
          userAvatar: other.avatar,
        })}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Image source={{ uri: other.avatar }} style={styles.avatar} />
          {online && <View style={styles.onlineIndicator} />}
        </View>
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.userName} numberOfLines={1}>{other.name}</Text>
            <Text style={styles.time}>{formatTime(item.last_message_time)}</Text>
          </View>
          <View style={styles.messageRow}>
            <Text
              style={[styles.lastMessage, unreadCount > 0 && styles.unreadMessage]}
              numberOfLines={1}
            >
              {item.last_message || 'No messages yet'}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredConversations}
        keyExtractor={item => item.id}
        renderItem={renderConversation}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.textLight} />
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>Start chatting with your classmates!</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  header: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl + 10,
    paddingBottom: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    backgroundColor: theme.colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    margin: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  content: {
    flexGrow: 1,
    paddingBottom: theme.spacing.md,
  },
  conversationCard: {
    backgroundColor: theme.colors.white,
    flexDirection: 'row',
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  userName: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  time: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textLight,
    fontWeight: theme.fontWeight.medium,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    lineHeight: 20,
  },
  unreadMessage: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: theme.spacing.sm,
  },
  unreadCount: {
    color: theme.colors.white,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl * 2,
    paddingHorizontal: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textLight,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
});
