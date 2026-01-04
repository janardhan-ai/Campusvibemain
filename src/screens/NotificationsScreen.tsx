import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SectionList, 
  Image, 
  TouchableOpacity, 
  StatusBar,
  Platform,
  RefreshControl 
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types'; 
import { Ionicons } from '@expo/vector-icons'; 

type Props = NativeStackScreenProps<HomeStackParamList, 'Notifications'>;

// --- 1. TYPES ---
type NotificationType = 'like' | 'comment' | 'follow' | 'event' | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  user: {
    id: string;
    name: string;
    username: string; 
    avatar: string;
    followers: number;
    following: number;
  };
  content?: string; 
  postImage?: string;
  timestamp: string;
  isFollowing?: boolean; 
  isRequest?: boolean; // <--- NEW: Distinguishes "Request" from "Follow"
  read: boolean;
  relatedId?: string; 
}

interface NotificationSection {
  title: string;
  data: Notification[];
}

// --- 2. MOCK DATA (With Request Examples) ---
const RAW_NOTIFICATIONS: Notification[] = [
  // --- NEW SECTION ---
  { 
    id: '1', type: 'follow', 
    user: { 
      id: 'u1', name: 'Priya Sharma', username: 'priya_s', avatar: 'https://i.pravatar.cc/150?img=5',
      followers: 1240, following: 180 
    }, 
    timestamp: '2m', isFollowing: false, read: false,
    isRequest: true, // <--- TEST: This will show Confirm/Delete
    relatedId: 'u1' 
  },
  { 
    id: '2', type: 'like', 
    user: { 
      id: 'u2', name: 'Rahul Verma', username: 'rahul_v', avatar: 'https://i.pravatar.cc/150?img=12',
      followers: 890, following: 500
    }, 
    postImage: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=200&auto=format&fit=crop',
    timestamp: '15m', read: false,
    relatedId: 'post_101'
  },
  
  // --- YESTERDAY SECTION ---
  { 
    id: '3', type: 'comment', 
    user: { 
      id: 'u3', name: 'Arjun Das', username: 'arjun_d', avatar: 'https://i.pravatar.cc/150?img=3',
      followers: 450, following: 420
    }, 
    content: 'Bro, is this notes pdf available for ECE branch too?',
    postImage: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=200&auto=format&fit=crop',
    timestamp: '1d', read: true,
    relatedId: 'post_102' 
  },
  { 
    id: '4', type: 'follow', 
    user: { 
      id: 'u4', name: 'Neha Gupta', username: 'neha_g', avatar: 'https://i.pravatar.cc/150?img=9',
      followers: 2100, following: 150
    }, 
    timestamp: '1d', isFollowing: true, read: true,
    relatedId: 'u4'
  },
  { 
    id: '5', type: 'event', 
    user: { 
      id: 'sys', name: 'Campus Vibe', username: 'system', avatar: '',
      followers: 0, following: 0 
    },
    content: 'Reminder: "Tech Fest 2025" starts tomorrow!',
    timestamp: '1d', read: true,
    relatedId: 'event_55' 
  },

  // --- THIS WEEK SECTION ---
  { 
    id: '6', type: 'like', 
    user: { 
      id: 'u5', name: 'Kiran Kumar', username: 'kiran_k', avatar: 'https://i.pravatar.cc/150?img=11',
      followers: 120, following: 80
    }, 
    postImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=200&auto=format&fit=crop',
    timestamp: '3d', read: true,
    relatedId: 'post_103'
  },
  { 
    id: '7', type: 'system', 
    user: { 
      id: 'sys', name: 'Campus Vibe', username: 'system', avatar: '',
      followers: 0, following: 0 
    },
    content: 'Your profile is now 100% complete. Great job!',
    timestamp: '5d', read: true,
    relatedId: '' 
  },
];

const SECTIONS: NotificationSection[] = [
  { title: 'New', data: RAW_NOTIFICATIONS.slice(0, 2) },
  { title: 'Yesterday', data: RAW_NOTIFICATIONS.slice(2, 5) },
  { title: 'This Week', data: RAW_NOTIFICATIONS.slice(5) },
];

export const NotificationsScreen = ({ navigation }: Props) => {
  const [sections, setSections] = useState(SECTIONS);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  // --- LOGIC: MARK ALL AS READ ---
  const handleMarkAllAsRead = () => {
    const updatedSections = sections.map(section => ({
      ...section,
      data: section.data.map(item => ({ ...item, read: true }))
    }));
    setSections(updatedSections);
  };

  // --- LOGIC: CONFIRM REQUEST ---
  const handleConfirmRequest = (id: string) => {
    const newSections = sections.map(sec => ({
      ...sec,
      data: sec.data.map(item => {
        // Switch from Request Mode to Normal Follow Mode (so you can follow back)
        if (item.id === id) return { ...item, isRequest: false, read: true };
        return item;
      })
    }));
    setSections(newSections);
  };

  // --- LOGIC: DELETE REQUEST ---
  const handleDeleteRequest = (id: string) => {
    const newSections = sections.map(sec => ({
      ...sec,
      data: sec.data.filter(item => item.id !== id)
    })).filter(sec => sec.data.length > 0); // Remove empty sections if needed
    setSections(newSections);
  };

  // --- LOGIC: STANDARD FOLLOW TOGGLE ---
  const handleFollowToggle = (id: string) => {
    const newSections = sections.map(sec => ({
      ...sec,
      data: sec.data.map(item => {
        if (item.id === id) return { ...item, isFollowing: !item.isFollowing };
        return item;
      })
    }));
    setSections(newSections);
  };

  const handleNotificationPress = (item: Notification) => {
    const updatedSections = sections.map(sec => ({
       ...sec,
       data: sec.data.map(n => n.id === item.id ? { ...n, read: true } : n)
    }));
    setSections(updatedSections);

    switch (item.type) {
      case 'like':
      case 'comment':
        if (item.relatedId) {
          // @ts-ignore 
          navigation.navigate('PostDetailScreen', { postId: item.relatedId });
        }
        break;
      
      case 'follow':
        // @ts-ignore
        navigation.push('Profile', { user: item.user });
        break;

      case 'event':
        if (item.relatedId) {
           // @ts-ignore
           navigation.navigate('EventDetailScreen', { eventId: item.relatedId });
        }
        break;
        
      default:
        console.log("System notification clicked");
    }
  };

  const getBadgeIcon = (type: NotificationType) => {
    switch (type) {
      case 'like': return { name: 'heart', color: '#ff3b30', bg: '#ffe5e5' };
      case 'comment': return { name: 'chatbubble', color: '#007aff', bg: '#e5f1ff' };
      case 'follow': return { name: 'person', color: '#5856d6', bg: '#e5e5ff' };
      case 'event': return { name: 'calendar', color: '#ff9500', bg: '#fff5e5' };
      case 'system': return { name: 'information-circle', color: '#888', bg: '#f0f0f0' };
      default: return null;
    }
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const badge = getBadgeIcon(item.type);

    return (
      <TouchableOpacity 
        style={[styles.itemContainer, !item.read && styles.unreadItem]} 
        activeOpacity={0.7}
        onPress={() => handleNotificationPress(item)} 
      >
        <View style={styles.avatarContainer}>
          {item.type === 'event' || item.type === 'system' ? (
             <View style={[styles.avatar, styles.systemAvatar]}>
                <Ionicons name="school" size={24} color="#fff" />
             </View>
          ) : (
             <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
          )}
          
          {badge && (
            <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: item.read ? '#fff' : '#f0f9ff' }]}>
               <Ionicons name={badge.name as any} size={10} color={badge.color} />
            </View>
          )}
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.text} numberOfLines={2}>
            <Text style={styles.username}>
                {(item.type === 'event' || item.type === 'system') ? 'Campus Vibe' : item.user.name}
            </Text>

            {item.type === 'system' && ` ${item.content}`}
            {item.type === 'like' && ' liked your post.'}
            {item.type === 'comment' && ` commented: "${item.content}"`}
            
            {/* UPDATED TEXT LOGIC */}
            {item.type === 'follow' && (item.isRequest ? ' requested to follow you.' : ' started following you.')}
            
            {item.type === 'event' && ` ${item.content}`}
          </Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>

        <View style={styles.rightAction}>
          {item.type === 'follow' ? (
             // --- CONDITIONAL BUTTONS FOR REQUESTS VS FOLLOWS ---
             item.isRequest ? (
                <View style={styles.requestButtons}>
                    <TouchableOpacity 
                      style={styles.confirmBtn} 
                      onPress={() => handleConfirmRequest(item.id)}
                    >
                      <Text style={styles.confirmText}>Confirm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteBtn} 
                      onPress={() => handleDeleteRequest(item.id)}
                    >
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                </View>
             ) : (
                <TouchableOpacity 
                  style={[styles.followButton, item.isFollowing && styles.followingButton]}
                  onPress={() => handleFollowToggle(item.id)}
                >
                  <Text style={[styles.followBtnText, item.isFollowing && styles.followingBtnText]}>
                    {item.isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
             )
          ) : (
            item.postImage && (
              <Image source={{ uri: item.postImage }} style={styles.postThumbnail} />
            )
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        
        {/* ADDED ON PRESS HERE */}
        <TouchableOpacity onPress={handleMarkAllAsRead}>
           <Ionicons name="checkmark-done-circle-outline" size={24} color="#007aff" />
        </TouchableOpacity>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
            <View style={styles.emptyState}>
                <Ionicons name="notifications-off-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
        }
        refreshControl={
           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007aff']} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { 
    flex: 1, 
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
    backgroundColor: '#fff',
    height: 56, 
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  listContent: { paddingBottom: 20 },
  sectionHeader: { 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: '#fff' 
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#333' },
  itemContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
  },
  unreadItem: { backgroundColor: '#f0f9ff' }, 
  avatarContainer: { position: 'relative', marginRight: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eee' },
  systemAvatar: { backgroundColor: '#FF6B6B', alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  contentContainer: { flex: 1, marginRight: 8 },
  text: { fontSize: 14, color: '#333', lineHeight: 20 },
  username: { fontWeight: '700', color: '#000' },
  timestamp: { fontSize: 12, color: '#999', marginTop: 2 },
  rightAction: { minWidth: 70, alignItems: 'flex-end' },
  postThumbnail: { width: 44, height: 44, borderRadius: 6, backgroundColor: '#eee' },
  
  // STANDARD FOLLOW BUTTON
  followButton: { 
    paddingHorizontal: 14, 
    paddingVertical: 6, 
    backgroundColor: '#007aff', 
    borderRadius: 6 
  },
  followingButton: { backgroundColor: '#eee', borderWidth: 1, borderColor: '#ddd' },
  followBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  followingBtnText: { color: '#333' },

  // NEW REQUEST BUTTONS
  requestButtons: { flexDirection: 'row', gap: 6 },
  confirmBtn: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    backgroundColor: '#007aff', 
    borderRadius: 6 
  },
  confirmText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  deleteBtn: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    backgroundColor: '#eee', 
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  deleteText: { fontSize: 12, fontWeight: '600', color: '#333' },

  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: 10 },
  emptyText: { color: '#999', fontSize: 16 }
});