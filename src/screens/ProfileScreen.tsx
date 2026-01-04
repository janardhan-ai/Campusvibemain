import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Modal, 
  TouchableWithoutFeedback, 
  Share, 
  Alert, 
  TextInput, 
  FlatList, 
  StatusBar
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types';
import { useApp } from '../context/AppContext';
import { 
  Settings, MapPin, BookOpen, Calendar, Heart, MessageCircle, 
  MoreVertical, Upload, Zap, MessageSquare, Lock 
} from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons'; 

import { mockEvents } from '../data/events'; 

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;
type ProfileTab = 'posts' | 'notes' | 'events';
type FollowStatus = 'None' | 'Following' | 'Requested';

const { width } = Dimensions.get('window');

const DEFAULT_BANNER = "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1000&auto=format&fit=crop";

const MOCK_POSTS = [
  { id: 'm1', image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=1000&auto=format&fit=crop', likes: 124, comments: 45 },
  { id: 'm2', image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1000&auto=format&fit=crop', likes: 89, comments: 12 },
  { id: 'm3', image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000&auto=format&fit=crop', likes: 56, comments: 8 }
];

const MOCK_NOTES = [
  { id: 'n1', title: 'Engineering Math III', subject: 'Mathematics', year: '2nd Year', likes: 45, createdAt: '2 days ago' },
  { id: 'n2', title: 'DSA - Trees', subject: 'DSA', year: '2nd Year', likes: 89, createdAt: '1 week ago' },
];

const ALL_USERS_DB = [
  { id: 'u1', name: 'Rahul', username: 'rahul_01', avatar: 'https://i.pravatar.cc/150?img=12', accountType: 'follower', shareCount: 150 }, 
  { id: 'u2', name: 'Priya', username: 'priya_x', avatar: 'https://i.pravatar.cc/150?img=5', accountType: 'public', shareCount: 85 },   
];
const MY_REGISTRATIONS = [ { eventId: '1', status: 'Attending' }, { eventId: '2', status: 'Attended' } ];

export const ProfileScreen = ({ navigation, route }: Props) => {
  const { currentUser, posts, notes, events, followUser, unfollowUser, checkFollowStatus, messages } = useApp();
  
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [menuVisible, setMenuVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const viewedUser = route.params?.user || currentUser;
  const isOwnProfile = currentUser?.id === viewedUser?.id;

  const [followStatus, setFollowStatus] = useState<FollowStatus>('None');
  const [hasIncomingRequest, setHasIncomingRequest] = useState(false); 
  const [followsMe, setFollowsMe] = useState(false); 

  const shareableUsers = ALL_USERS_DB.filter(user => 
    (user.accountType === 'follower' || user.accountType === 'public') && 
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => b.shareCount - a.shareCount);

  useEffect(() => {
    const loadStatus = async () => {
      if (!isOwnProfile && currentUser) {
        const status = await checkFollowStatus(viewedUser.id);
        setFollowStatus(status);
        if(viewedUser.id === 'u1') setHasIncomingRequest(true);
        if(viewedUser.id === 'u2') setFollowsMe(true);
      }
    };
    loadStatus();
  }, [viewedUser.id, isOwnProfile]);

  const handleConfirmRequest = async () => {
    Alert.alert("Success", "You accepted the follow request.");
    setHasIncomingRequest(false);
    setFollowsMe(true); 
  };

  const handleDeleteRequest = async () => {
    setHasIncomingRequest(false);
  };

  const isAccessDenied = (viewedUser as any).isPrivate && !isOwnProfile && followStatus !== 'Following';
  if (!viewedUser) return null;

  const realPosts = posts.filter(p => p.userId === viewedUser.id);
  const userPosts = [...realPosts, ...MOCK_POSTS]; 
  const userNotes = [...notes.filter(n => n.userId === viewedUser.id), ...MOCK_NOTES];
  const userEvents = mockEvents.filter(event => MY_REGISTRATIONS.some(reg => reg.eventId === event.id))
    .map(event => ({ ...event, status: 'Upcoming' })); 
  const userSkills = (viewedUser as any)?.skills || [];

  const handleMenuAction = (screen: string) => { setMenuVisible(false); navigation.navigate(screen as any); };
   
  const handleFollowToggle = async () => {
    if (followStatus === 'Following' || followStatus === 'Requested') { 
        setFollowStatus('None'); 
        await unfollowUser(viewedUser.id); 
    } 
    else { 
        const newStatus = (viewedUser as any).isPrivate && !followsMe ? 'Requested' : 'Following'; 
        setFollowStatus(newStatus); 
        if(newStatus === 'Requested') Alert.alert('Request Sent'); 
        await followUser(viewedUser); 
    }
  };

  // --- FIX IS HERE ---
  const handleMessage = () => {
    // Safety Check: Default to [] if messages is undefined
    const safeMessages = messages || [];
    
    const existingChat = safeMessages.find(chat => 
        chat.participants.some(p => p.id === viewedUser.id)
    );

    if (existingChat) {
        navigation.navigate('ChatDetailScreen', { 
            chatId: existingChat.id,
            recipient: viewedUser 
        });
    } else {
        navigation.navigate('ChatDetail', { 
            recipient: viewedUser 
        });
    }
  };

  const handleShareButtonPress = () => setShareModalVisible(true);
  const handleExternalShare = async () => { try { await Share.share({ message: `Check out ${viewedUser.name}!` }); } catch (error: any) {} };
  const handleCopyLink = () => { Alert.alert("Link Copied"); setShareModalVisible(false); };
  const handleSendInApp = () => { Alert.alert("Sent"); setShareModalVisible(false); };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.headerContainer}>
            <Image source={{ uri: DEFAULT_BANNER }} style={styles.coverPhoto} />
            <View style={styles.darkOverlay} />
            <View style={styles.headerOverlay}>
                {isOwnProfile ? (
                  <TouchableOpacity style={styles.settingsButton} onPress={() => setMenuVisible(true)}>
                    <MoreVertical size={20} color="#fff" />
                  </TouchableOpacity>
                ) : (
                  <View style={{ width: 40 }} /> 
                )}
            </View>
        </View>

        {/* INFO */}
        <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarRing}>
                <Image source={{ uri: viewedUser.avatar }} style={styles.avatar} />
              </View>
              {!isAccessDenied && <View style={styles.onlineBadge} />}
            </View>
            
            <Text style={styles.name}>{viewedUser.name}</Text>
            <Text style={styles.username}>@{viewedUser.username}</Text>
            
            {!isAccessDenied && (
              <View style={styles.academicRow}>
                <View style={styles.academicItem}><MapPin size={14} color="#666" /><Text style={styles.academicText}>{viewedUser.college}</Text></View>
                <Text style={styles.dotSeparator}>•</Text>
                <View style={styles.academicItem}><BookOpen size={14} color="#666" /><Text style={styles.academicText}>{viewedUser.branch}</Text></View>
                <Text style={styles.dotSeparator}>•</Text>
                <View style={styles.academicItem}><Calendar size={14} color="#666" /><Text style={styles.academicText}>Year {viewedUser.year}</Text></View>
              </View>
            )}

            {viewedUser.bio && <Text style={styles.bio}>{viewedUser.bio}</Text>}
            
            {!isAccessDenied && userSkills.length > 0 && (
              <View style={styles.badges}>
                {userSkills.map((skill: string, index: number) => (
                  <View key={index} style={styles.badge}>
                    <Zap size={12} color={index === 0 ? "#f59e0b" : "#10b981"} />
                    <Text style={styles.badgeText}>{skill}</Text>
                  </View>
                ))}
              </View>
            )}
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
            <View style={styles.statItem}><Text style={styles.statValue}>{userPosts.length}</Text><Text style={styles.statLabel}>Posts</Text></View>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem} disabled={isAccessDenied} onPress={() => navigation.navigate('FollowersScreen', { userId: viewedUser.id })}>
              <Text style={styles.statValue}>{viewedUser.followers}</Text><Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem} disabled={isAccessDenied} onPress={() => navigation.navigate('FollowingScreen', { userId: viewedUser.id })}>
              <Text style={styles.statValue}>{viewedUser.following}</Text><Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
        </View>

        {/* ACTIONS */}
        <View style={styles.actionsSection}>
          {isOwnProfile ? (
            <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile')}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <>
              {hasIncomingRequest ? (
                <View style={{ flex: 4, flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity style={[styles.followButton, { backgroundColor: '#007aff' }]} onPress={handleConfirmRequest}>
                    <Text style={styles.followButtonText}>Confirm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.followButton, { backgroundColor: '#eee' }]} onPress={handleDeleteRequest}>
                    <Text style={[styles.followButtonText, { color: '#000' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.followButton, (followStatus === 'Following' || followStatus === 'Requested') && styles.followingButton]} 
                  onPress={handleFollowToggle}
                >
                  <Text style={[styles.followButtonText, (followStatus === 'Following' || followStatus === 'Requested') && styles.followingButtonText]}>
                      {followStatus === 'Following' ? 'Following' : 
                       followStatus === 'Requested' ? 'Requested' : 
                       followsMe ? 'Follow Back' : 'Follow'} 
                  </Text>
                </TouchableOpacity>
              )}

              {!isAccessDenied && (
                <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
                   <MessageSquare size={20} color="#000" />
                </TouchableOpacity>
              )}
            </>
          )}
          <TouchableOpacity style={styles.shareButton} onPress={handleShareButtonPress}>
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* CONTENT */}
        {isAccessDenied ? (
          <View style={styles.lockedContainer}>
            <View style={styles.lockIconCircle}><Lock size={32} color="#000" /></View>
            <Text style={styles.lockedTitle}>Private Account</Text>
            <Text style={styles.lockedSubtitle}>Follow this account to see their photos, videos, and info.</Text>
          </View>
        ) : (
          <View style={styles.contentSection}>
              <View style={styles.tabsContainer}>
                <TouchableOpacity style={[styles.tabChip, activeTab === 'posts' && styles.tabChipActive]} onPress={() => setActiveTab('posts')}><Text style={[styles.tabChipText, activeTab === 'posts' && styles.tabChipTextActive]}>Posts</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.tabChip, activeTab === 'notes' && styles.tabChipActive]} onPress={() => setActiveTab('notes')}><Text style={[styles.tabChipText, activeTab === 'notes' && styles.tabChipTextActive]}>Notes</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.tabChip, activeTab === 'events' && styles.tabChipActive]} onPress={() => setActiveTab('events')}><Text style={[styles.tabChipText, activeTab === 'events' && styles.tabChipTextActive]}>Events</Text></TouchableOpacity>
              </View>

              {activeTab === 'posts' && (
                userPosts.length === 0 ? (
                  <View style={styles.emptyState}><Heart size={32} color="#ccc" /><Text style={styles.emptyTitle}>No posts yet</Text></View>
                ) : (
                  <View style={styles.gridContainer}>
                    {userPosts.map((post, index) => (
                      <TouchableOpacity key={index} style={styles.gridItem} activeOpacity={0.8} onPress={() => navigation.navigate('PostDetailScreen', { postId: post.id })}>
                        <Image source={{ uri: post.image }} style={styles.gridImage} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )
              )}
              
              {activeTab === 'notes' && (
                <View style={styles.notesGrid}>
                  {userNotes.map(note => (
                    <TouchableOpacity key={note.id} style={styles.noteCard} onPress={() => navigation.navigate('NoteDetailScreen', { noteId: note.id })}>
                      <View style={styles.noteHeader}><BookOpen size={16} color="#fff" /><Text style={styles.noteSubject}>{note.subject}</Text></View>
                      <Text style={styles.noteTitle}>{note.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {activeTab === 'events' && (
                  <View style={styles.eventsList}>
                    {userEvents.map(event => (
                      <TouchableOpacity key={event.id} style={styles.eventCard} onPress={() => navigation.navigate('EventDetailScreen', { eventId: event.id })}>
                        <View style={styles.dateBadge}><Text style={styles.dateText}>{new Date(event.event_date).getDate()}</Text><Text style={styles.monthText}>OCT</Text></View>
                        <View style={styles.eventInfo}><Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text><Text style={styles.eventLocation}>{event.location}</Text></View>
                      </TouchableOpacity>
                    ))}
                  </View>
              )}
          </View>
        )}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* MODALS */}
      <Modal visible={menuVisible} transparent={true} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.menuContainer}>
                <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuAction('Settings')}><Settings size={18} color="#000" /><Text style={styles.menuText}>Settings</Text></TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuAction('CreateScreen')}><Upload size={18} color="#000" /><Text style={styles.menuText}>Upload</Text></TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
      </Modal>

      <Modal animationType="slide" transparent={true} visible={shareModalVisible} onRequestClose={() => setShareModalVisible(false)}>
        <View style={styles.shareModalOverlay}>
          <View style={styles.shareModalContent}> 
            <View style={styles.shareHeader}><Text style={styles.shareTitle}>Share Profile</Text><TouchableOpacity onPress={() => setShareModalVisible(false)}><Ionicons name="close" size={24} color="#000" /></TouchableOpacity></View>
            <View style={styles.externalShareContainer}>
              <TouchableOpacity style={styles.externalShareItem} onPress={handleExternalShare}><View style={[styles.iconCircle, { backgroundColor: '#007aff' }]}><Ionicons name="share-social" size={24} color="#fff" /></View><Text style={styles.externalShareText}>Share via...</Text></TouchableOpacity>
              <TouchableOpacity style={styles.externalShareItem} onPress={handleCopyLink}><View style={[styles.iconCircle, { backgroundColor: '#f0f0f0' }]}><Ionicons name="link" size={24} color="#333" /></View><Text style={styles.externalShareText}>Copy Link</Text></TouchableOpacity>
            </View>
            <View style={styles.divider} />
            <Text style={styles.sectionHeader}>Send to friends</Text>
            <View style={styles.searchContainer}><Ionicons name="search" size={20} color="#666" style={{marginRight: 8}} /><TextInput placeholder="Search followers..." value={searchQuery} onChangeText={setSearchQuery} style={styles.searchInput} /></View>
            <FlatList data={shareableUsers} keyExtractor={item => item.id} contentContainerStyle={{ paddingHorizontal: 20 }} renderItem={({ item }) => (
                <View style={styles.shareRow}><View style={{flexDirection:'row', alignItems:'center', gap:12}}><Image source={{ uri: item.avatar }} style={styles.shareAvatar} /><Text style={{fontWeight:'600'}}>{item.name}</Text></View><TouchableOpacity style={styles.sendButton} onPress={() => handleSendInApp(item.username)}><Text style={styles.sendButtonText}>Send</Text></TouchableOpacity></View>
            )} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollView: { flex: 1 },
  headerContainer: { position: 'relative', height: 160, overflow: 'hidden', backgroundColor: '#222' }, 
  coverPhoto: { width: '100%', height: '100%', resizeMode: 'cover' },
  darkOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)' },
  headerOverlay: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  settingsButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  profileInfo: { alignItems: 'center', paddingHorizontal: 24, marginTop: 0 },
  avatarContainer: { position: 'relative', marginTop: -50, marginBottom: 10 }, 
  avatarRing: { padding: 4, borderRadius: 60, backgroundColor: '#fff' },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  onlineBadge: { position: 'absolute', bottom: 6, right: 6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#34c759', borderWidth: 3, borderColor: '#fff' },
  name: { fontSize: 24, fontWeight: '800', color: '#000', marginBottom: 2 },
  username: { fontSize: 14, color: '#666', marginBottom: 10 },
  academicRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12, flexWrap: 'wrap' },
  academicItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  academicText: { fontSize: 13, color: '#444', fontWeight: '500' },
  dotSeparator: { marginHorizontal: 8, color: '#ccc' },
  bio: { fontSize: 14, color: '#333', textAlign: 'center', lineHeight: 20, marginBottom: 12, paddingHorizontal: 20 },
  badges: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f5f5f7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#333' },
  statsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20, gap: 24 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#000' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  statDivider: { width: 1, height: 20, backgroundColor: '#eee' },
  actionsSection: { flexDirection: 'row', paddingHorizontal: 24, gap: 10, marginBottom: 24 },
  editButton: { flex: 4, backgroundColor: '#000', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  editButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  followButton: { flex: 4, backgroundColor: '#007aff', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  followingButton: { backgroundColor: '#eee' },
  followButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  followingButtonText: { color: '#000' },
  messageButton: { flex: 1, backgroundColor: '#eee', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  shareButton: { flex: 1, backgroundColor: '#f5f5f7', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  shareButtonText: { fontSize: 14, fontWeight: '600', color: '#000' },
  contentSection: { flex: 1 },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tabChip: { paddingVertical: 12, marginRight: 24, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabChipActive: { borderBottomColor: '#000' },
  tabChipText: { fontSize: 14, fontWeight: '600', color: '#888' },
  tabChipTextActive: { color: '#000' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, justifyContent: 'space-between' },
  gridItem: { width: (width - 32) / 3 - 2, aspectRatio: 1, marginBottom: 4, borderRadius: 4, overflow: 'hidden', backgroundColor: '#f0f0f0' },
  gridImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  bottomSpacing: { height: 40 },
  lockedContainer: { alignItems: 'center', paddingVertical: 60 },
  lockIconCircle: { marginBottom: 16 },
  lockedTitle: { fontSize: 18, fontWeight: '700' },
  lockedSubtitle: { color: '#888' },
  notesGrid: { padding: 16, gap: 12 },
  noteCard: { backgroundColor: '#f9f9f9', padding: 16, borderRadius: 12, marginBottom: 8 },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  noteSubject: { fontWeight: '600', color: '#555', marginLeft: 8 },
  noteTitle: { fontSize: 16, fontWeight: '600' },
  eventsList: { padding: 16, gap: 12 },
  eventCard: { flexDirection: 'row', backgroundColor: '#f9f9f9', padding: 12, borderRadius: 12, alignItems: 'center', gap: 12 },
  dateBadge: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, width: 40, height: 40, justifyContent: 'center' },
  dateText: { fontWeight: '700', fontSize: 16 },
  monthText: { fontSize: 9, color: 'red', fontWeight: '700' },
  eventInfo: { flex: 1 },
  eventTitle: { fontWeight: '600', fontSize: 15 },
  eventLocation: { color: '#666', fontSize: 12, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
  menuContainer: { position: 'absolute', top: 50, right: 16, backgroundColor: '#fff', borderRadius: 12, width: 160, padding: 8, elevation: 5 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  menuText: { fontSize: 14, fontWeight: '500' },
  menuDivider: { height: 1, backgroundColor: '#eee', marginVertical: 4 },
  shareModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  shareModalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '50%', padding: 20 },
  shareHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  shareTitle: { fontSize: 18, fontWeight: '700' },
  externalShareContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  externalShareItem: { alignItems: 'center' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  externalShareText: { fontSize: 12 },
  divider: { height: 1, backgroundColor: '#eee', marginBottom: 16 },
  sectionHeader: { fontWeight: '600', color: '#666', marginBottom: 12 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 10, borderRadius: 8 },
  searchInput: { marginLeft: 8, flex: 1 },
  shareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  shareAvatar: { width: 36, height: 36, borderRadius: 18 },
  sendButton: { backgroundColor: '#000', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  sendButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});