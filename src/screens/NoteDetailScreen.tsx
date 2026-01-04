import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert, 
  Linking,
  Share,          // Added
  Modal,          // Added
  TextInput,      // Added
  FlatList        // Added
} from 'react-native'; 
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../components/PrimaryButton';

type Props = NativeStackScreenProps<ProfileStackParamList, 'NoteDetail'>;

// --- 1. MOCK DATA WITH RESOURCE LINKS ---
const MOCK_NOTES = [
  {
    id: 'n1',
    resourceType: 'PDF',
    title: 'Engineering Mathematics III - Full Unit 1',
    subject: 'Mathematics',
    description: 'Comprehensive notes covering Laplace Transforms, Fourier Series, and Z-Transforms. Includes solved examples from last 5 years question papers. Perfect for last-minute revision.',
    likes: 45,
    isLiked: true,
    saves: 120,
    isSaved: false,
    user: {
      name: 'Janardhan reddy',
      avatar: 'https://i.pravatar.cc/150?u=jana',
      college: 'CMRTC',
      branch: 'ECE',
      year: '4'
    },
    resourceUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  },
  {
    id: 'n2',
    resourceType: 'Handwritten',
    title: 'Data Structures & Algorithms - Trees',
    subject: 'DSA',
    description: 'Detailed explanation of Binary Trees, AVL Trees, and B-Trees with code snippets in C++. Hand-drawn diagrams for better visualization of rotations.',
    likes: 89,
    isLiked: false,
    saves: 340,
    isSaved: true,
    user: {
      name: 'Janardhan reddy',
      avatar: 'https://i.pravatar.cc/150?u=jana',
      college: 'CMRTC',
      branch: 'CSE',
      year: '3'
    },
    resourceUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  },
  {
    id: 'n3',
    resourceType: 'Slides',
    title: 'Digital Electronics - Logic Gates',
    subject: 'DLD',
    description: 'Professor approved slides for Digital Logic Design. Covers logic gates, K-Maps, and boolean algebra simplification techniques.',
    likes: 23,
    isLiked: false,
    saves: 85,
    isSaved: false,
    user: {
      name: 'Janardhan reddy',
      avatar: 'https://i.pravatar.cc/150?u=jana',
      college: 'CMRTC',
      branch: 'EEE',
      year: '2'
    },
    resourceUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  }
];

// --- SHARE DATA (Mock Friends) ---
const ALL_USERS_DB = [
  { id: 'u1', name: 'Rahul', username: 'rahul_01', avatar: 'https://i.pravatar.cc/150?img=12', accountType: 'follower', shareCount: 150 }, 
  { id: 'u2', name: 'Priya', username: 'priya_x', avatar: 'https://i.pravatar.cc/150?img=5', accountType: 'public', shareCount: 85 },   
  { id: 'u5', name: 'Kiran', username: 'kiran_tech', avatar: 'https://i.pravatar.cc/150?img=11', accountType: 'public', shareCount: 40 },  
  { id: 'u3', name: 'Arjun', username: 'arjun_dev', avatar: 'https://i.pravatar.cc/150?img=3', accountType: 'follower', shareCount: 12 },  
  { id: 'u4', name: 'Neha', username: 'neha_design', avatar: 'https://i.pravatar.cc/150?img=9', accountType: 'private', shareCount: 0 },   
];

export const NoteDetailScreen = ({ navigation, route }: Props) => {
  const { noteId } = route.params;
  const { notes, likeNote, saveNote } = useApp();
   
  // Find note in Real Data OR Mock Data
  const note = notes.find(n => n.id === noteId) || MOCK_NOTES.find(n => n.id === noteId);

  // --- SHARE STATES ---
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- SHARE FILTER LOGIC ---
  const shareableUsers = ALL_USERS_DB
    .filter(user => {
      const isEligible = user.accountType === 'follower' || user.accountType === 'public';
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            user.username.toLowerCase().includes(searchQuery.toLowerCase());
      return isEligible && matchesSearch;
    })
    .sort((a, b) => b.shareCount - a.shareCount);

  if (!note) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
        </View>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <Text>Note not found</Text>
        </View>
      </View>
    );
  }

  // --- 2. UPDATED HANDLER TO OPEN LINK ---
  const handleOpenResource = async () => {
    const url = (note as any).resourceUrl; 

    if (url) {
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url); 
        } else {
          Alert.alert("Error", "Cannot open this resource link");
        }
      } catch (err) {
        Alert.alert("Error", "Something went wrong opening the file");
      }
    } else {
      Alert.alert("No Resource", "This note doesn't have a valid link attached.");
    }
  };

  // --- SHARE HANDLERS ---
  const handleExternalShare = async () => {
    if (!note) return;
    try {
      await Share.share({
        message: `Check out these notes: ${note.title} for ${note.subject}!\n${(note as any).resourceUrl || ''}`,
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  const handleCopyLink = () => {
    Alert.alert("Link Copied", "Note link copied to clipboard.");
    setShareModalVisible(false);
  };

  const handleSendInApp = (username: string) => {
    Alert.alert("Sent", `Note shared with @${username}`);
    setShareModalVisible(false);
    setSearchQuery(''); 
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* --- HEADER (Back Button + Share Button) --- */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Note</Text>
          
          {/* NEW SHARE BUTTON */}
          <TouchableOpacity onPress={() => setShareModalVisible(true)} style={styles.shareButton}>
             <Ionicons name="share-social-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{note.resourceType.toUpperCase()}</Text>
          </View>

          <Text style={styles.title}>{note.title}</Text>
          <Text style={styles.subject}>{note.subject}</Text>

          <View style={styles.userInfo}>
            <Image source={{ uri: note.user.avatar }} style={styles.avatar} />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{note.user.name}</Text>
              <Text style={styles.userCollege}>
                {note.user.college} • {note.user.branch} • Year {note.user.year}
              </Text>
            </View>
          </View>

          <View style={styles.stats}>
            <TouchableOpacity style={styles.stat} onPress={() => likeNote(note.id)}>
              <Ionicons
                name={note.isLiked ? 'heart' : 'heart-outline'}
                size={24}
                color={note.isLiked ? theme.colors.error : theme.colors.textMuted}
              />
              <Text style={styles.statText}>{note.likes} likes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.stat} onPress={() => saveNote(note.id)}>
              <Ionicons
                name={note.isSaved ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={note.isSaved ? theme.colors.primary : theme.colors.textMuted}
              />
              <Text style={styles.statText}>{note.saves} saves</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.description}>
            <Text style={styles.descriptionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{note.description}</Text>
          </View>

          <PrimaryButton title="Open Resource" onPress={handleOpenResource} />
        </View>
      </ScrollView>

      {/* --- SHARE MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={shareModalVisible}
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.shareModalOverlay}>
          <View style={styles.shareModalContent}> 
            <View style={styles.shareHeader}>
              <Text style={styles.shareTitle}>Share Note</Text>
              <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {/* External Share */}
            <View style={styles.externalShareContainer}>
              <TouchableOpacity style={styles.externalShareItem} onPress={handleExternalShare}>
                <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary }]}>
                   <Ionicons name="share-social" size={24} color="#fff" />
                </View>
                <Text style={styles.externalShareText}>Share via...</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.externalShareItem} onPress={handleCopyLink}>
                <View style={[styles.iconCircle, { backgroundColor: '#f0f0f0' }]}>
                   <Ionicons name="link" size={24} color="#333" />
                </View>
                <Text style={styles.externalShareText}>Copy Link</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionHeader}>Send to friends</Text>

            {/* In-App Share */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666" style={{marginRight: 8}} />
              <TextInput 
                placeholder="Search followers..." 
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
            </View>

            <FlatList 
              data={shareableUsers}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
              renderItem={({ item }) => (
                <View style={styles.shareRow}>
                  <View style={{flexDirection:'row', alignItems:'center', gap:12}}>
                    <Image source={{ uri: item.avatar }} style={styles.shareAvatar} />
                    <View>
                      <Text style={{fontWeight:'600', fontSize: 16}}>{item.name}</Text>
                      <Text style={{fontSize:12, color:'#666'}}>@{item.username}</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.sendButton} 
                    onPress={() => handleSendInApp(item.username)}
                  >
                    <Text style={styles.sendButtonText}>Send</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl + 10,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  // Added Share Button Style
  shareButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  content: {
    padding: theme.spacing.lg,
  },
  badge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  badgeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.white,
    fontWeight: theme.fontWeight.semibold,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subject: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary,
    marginBottom: theme.spacing.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userDetails: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  userName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  userCollege: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    gap: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
  },
  description: {
    marginBottom: theme.spacing.lg,
  },
  descriptionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  descriptionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    lineHeight: 22,
  },
  // --- SHARE MODAL STYLES ---
  shareModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  shareModalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '65%' },
  shareHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  shareTitle: { fontSize: 18, fontWeight: '700' },
  externalShareContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20 },
  externalShareItem: { alignItems: 'center', gap: 8 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  externalShareText: { fontSize: 12, color: '#333', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#eee', marginHorizontal: 20, marginBottom: 16 },
  sectionHeader: { paddingHorizontal: 20, fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 10 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', marginHorizontal: 20, marginBottom: 16, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  searchInput: { flex: 1, fontSize: 16 },
  shareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  shareAvatar: { width: 40, height: 40, borderRadius: 20 },
  sendButton: { backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  sendButtonText: { color: '#fff', fontWeight: '600' }
});