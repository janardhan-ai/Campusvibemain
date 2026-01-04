import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList, Post } from '../types';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import { PostCard } from '../components/PostCard';
import { CommentsModal } from '../components/CommentsModal';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

export const HomeScreen = ({ navigation }: Props) => {
  const { currentUser, posts, notifications } = useApp();
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // --- NEW: AUTO-ROTATION LOGIC ---
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Get first 4 notifications (or less if fewer exist)
  const recentNotifications = notifications.slice(0, 4);

  useEffect(() => {
    if (recentNotifications.length <= 1) return; // Don't rotate if 0 or 1 item

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % recentNotifications.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [recentNotifications.length]);

  const activeNotification = recentNotifications[currentIndex];
  // --------------------------------

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logo}>
            <Ionicons name="school" size={24} color={theme.colors.primary} />
          </View>
          <Text style={styles.headerTitle}>CampusVibe</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Events')}
          >
            <Ionicons name="calendar-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Messages')}
          >
            <View>
              <Ionicons name="chatbubbles-outline" size={24} color={theme.colors.text} />
              {/* Optional: Add badge here later */}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item, index) => item.id + '-' + index}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <Text style={styles.greeting}>{getGreeting()}, {currentUser?.name}!</Text>

            {/* --- UPDATED NOTIFICATION CARD --- */}
            {activeNotification && (
              <TouchableOpacity
                style={styles.activityCard}
                onPress={() => navigation.navigate('Notifications')}
                activeOpacity={0.9} // Slight feedback on press
              >
                {activeNotification.user && (
                  <Image
                    source={{ uri: activeNotification.user.avatar }}
                    style={styles.activityAvatar}
                  />
                )}
                <View style={styles.activityContent}>
                   {/* Create specific message based on type if 'message' prop is missing from your Notification type */}
                  <Text style={styles.activityText} numberOfLines={1}>
                    <Text style={{fontWeight: 'bold'}}>{activeNotification.user?.name}</Text>
                    {activeNotification.type === 'like' && ' liked your post.'}
                    {activeNotification.type === 'comment' && ' commented on your post.'}
                    {activeNotification.type === 'follow' && ' started following you.'}
                    {activeNotification.type === 'event' && ` posted an event.`}
                  </Text>
                  <Text style={styles.activityTime}>{activeNotification.timestamp || 'Just now'}</Text>
                </View>
                
                {/* Pagination Dots to show rotation */}
                <View style={styles.paginationDots}>
                  {recentNotifications.map((_, idx) => (
                    <View 
                      key={idx} 
                      style={[
                        styles.dot, 
                        currentIndex === idx && styles.activeDot
                      ]} 
                    />
                  ))}
                </View>
              </TouchableOpacity>
            )}
            {/* --------------------------------- */}
          </>
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => navigation.navigate('PostDetailScreen', { postId: item.id })} // Ensure name matches Stack
            onCommentPress={() => {
              setSelectedPost(item);
              setShowCommentsModal(true);
            }}
          />
        )}
      />
      <CommentsModal
        visible={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        post={selectedPost}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  content: {
    padding: theme.spacing.md,
  },
  greeting: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  // UPDATED CARD STYLES
  activityCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.sm,
    height: 70, // Fixed height prevents jumping content
  },
  activityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.sm,
  },
  activityContent: {
    flex: 1,
    justifyContent: 'center',
  },
  activityText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  // PAGINATION DOTS
  paginationDots: {
    position: 'absolute',
    right: 12,
    top: 12,
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#eee',
  },
  activeDot: {
    backgroundColor: theme.colors.primary,
  },
});