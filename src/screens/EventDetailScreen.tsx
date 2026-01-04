import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert,
  Share, 
  Modal, 
  TextInput, 
  FlatList 
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { mockEvents, Event } from '../data/events'; 

// --- 1. IMPORT SMART RATIO LOGIC ---
import { getSmartAspectRatio } from './utils/aspectRatio';

type Props = NativeStackScreenProps<HomeStackParamList, 'EventDetail'>;

// --- REGISTRATION DATA ---
const MY_REGISTRATIONS = [
  { eventId: '1', status: 'Attending' }, 
  { eventId: '2', status: 'Attended' }, 
  { eventId: '4', status: 'Attended' }   
];

// --- SHARE DATA (Mock Friends) ---
const ALL_USERS_DB = [
  { id: 'u1', name: 'Rahul', username: 'rahul_01', avatar: 'https://i.pravatar.cc/150?img=12', accountType: 'follower', shareCount: 150 }, 
  { id: 'u2', name: 'Priya', username: 'priya_x', avatar: 'https://i.pravatar.cc/150?img=5', accountType: 'public', shareCount: 85 },   
  { id: 'u5', name: 'Kiran', username: 'kiran_tech', avatar: 'https://i.pravatar.cc/150?img=11', accountType: 'public', shareCount: 40 },  
  { id: 'u3', name: 'Arjun', username: 'arjun_dev', avatar: 'https://i.pravatar.cc/150?img=3', accountType: 'follower', shareCount: 12 },  
  { id: 'u4', name: 'Neha', username: 'neha_design', avatar: 'https://i.pravatar.cc/150?img=9', accountType: 'private', shareCount: 0 },   
];

export const EventDetailScreen = ({ route, navigation }: Props) => {
  const { eventId } = route.params;
  const { currentUser } = useApp();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);

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

  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      parent?.setOptions({
        tabBarStyle: { height: 56, paddingBottom: 6, paddingTop: 6, display: 'flex' },
      });
    };
  }, [navigation]);

  useEffect(() => {
    const foundEvent = mockEvents.find(e => e.id === eventId);
    if (foundEvent) {
      setEvent(foundEvent);
    } else {
      Alert.alert('Error', 'Event not found');
    }

    const registration = MY_REGISTRATIONS.find(reg => reg.eventId === eventId);
    if (registration) {
      setBookingStatus(registration.status); 
    } else {
      setBookingStatus(null);
    }
    setLoading(false);
  }, [eventId]);

  // --- 2. CALCULATE ASPECT RATIO ---
  // Default to 1:1 if data missing, but use width/height if available
  // @ts-ignore
  const imageAspectRatio = event ? getSmartAspectRatio(event.width || 1080, event.height || 1080) : 1;

  const handleBooking = () => {
    if (!event) return;
    if (event.current_attendees >= event.max_attendees) {
      Alert.alert('Event Full', 'Sorry, this event is already at maximum capacity');
      return;
    }
    setBookingStatus('Attending'); 
    setEvent({ ...event, current_attendees: event.current_attendees + 1 });
    Alert.alert('Success', 'You have successfully registered for this event!');
  };

  // --- SHARE HANDLERS ---
  const handleExternalShare = async () => {
    if (!event) return;
    try {
      await Share.share({
        message: `Join me at ${event.title}!\n📍 ${event.location}\n📅 ${new Date(event.event_date).toDateString()}`,
        url: event.image_url // iOS support
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  const handleCopyLink = () => {
    Alert.alert("Link Copied", "Event link copied to clipboard.");
    setShareModalVisible(false);
  };

  const handleSendInApp = (username: string) => {
    Alert.alert("Sent", `Event shared with @${username}`);
    setShareModalVisible(false);
    setSearchQuery(''); 
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading || !event) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}><Text>Loading...</Text></View>
      </View>
    );
  }

  const spotsLeft = event.max_attendees - event.current_attendees;
  const isFull = spotsLeft <= 0;

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.imageContainer}>
          {/* --- 3. APPLY SMART RATIO STYLE --- */}
          <Image 
            source={{ uri: event.image_url }} 
            style={[styles.eventImage, { aspectRatio: imageAspectRatio }]} 
          />
          
          {/* --- HEADER (Back Button + Share Button) --- */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>

            {/* SHARE BUTTON */}
            <TouchableOpacity onPress={() => setShareModalVisible(true)} style={styles.shareButton}>
              <Ionicons name="share-social-outline" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{event.category}</Text>
          </View>
          <Text style={styles.title}>{event.title}</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar" size={20} color={theme.colors.primary} />
              <Text style={styles.infoText}>{formatDate(event.event_date)}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="location" size={20} color={theme.colors.primary} />
              <Text style={styles.infoText}>{event.location}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="business" size={20} color={theme.colors.primary} />
              <Text style={styles.infoText}>{event.college_name}</Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{event.current_attendees}</Text>
              <Text style={styles.statLabel}>Registered</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, isFull && styles.statNumberError]}>{spotsLeft}</Text>
              <Text style={styles.statLabel}>Spots Left</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{event.max_attendees}</Text>
              <Text style={styles.statLabel}>Capacity</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Event Details</Text>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={20} color={theme.colors.textLight} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>3 hours (estimated)</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="people-outline" size={20} color={theme.colors.textLight} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Expected Attendees</Text>
                <Text style={styles.detailValue}>{event.current_attendees} / {event.max_attendees}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* --- FOOTER --- */}
      <View style={styles.footer}>
        {bookingStatus === 'Attended' ? (
          <TouchableOpacity style={styles.attendedButton} disabled={true}>
            <Ionicons name="checkmark-done-circle" size={20} color="#666" />
            <Text style={styles.attendedButtonText}>Event Attended</Text>
          </TouchableOpacity>
        ) : bookingStatus === 'Attending' ? (
          <TouchableOpacity style={styles.registeredButton} disabled={true}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.white} />
            <Text style={styles.bookButtonText}>Registered / Attending</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.bookButton, isFull && styles.bookButtonDisabled]}
            onPress={handleBooking}
            disabled={isFull}
          >
            <Ionicons name="calendar-outline" size={20} color={theme.colors.white} />
            <Text style={styles.bookButtonText}>{isFull ? 'Event Full' : 'Book Now'}</Text>
          </TouchableOpacity>
        )}
      </View>

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
              <Text style={styles.shareTitle}>Share Event</Text>
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: theme.spacing.xl + 10,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between', 
    alignItems: 'center', 
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    // Height is now controlled by aspect ratio logic
  },
  eventImage: {
    width: '100%',
    // Removed fixed height: 300 
    // AspectRatio is applied inline
    resizeMode: 'cover',
    backgroundColor: theme.colors.backgroundLight,
  },
  content: {
    padding: theme.spacing.md,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primaryLight + '30',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.md,
  },
  categoryText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    marginBottom: theme.spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.lg,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  statNumberError: {
    color: theme.colors.error,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    lineHeight: 22,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
  },
  detailValue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  footer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  bookButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  registeredButton: {
    backgroundColor: '#34c759',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    opacity: 0.9,
  },
  attendedButton: {
    backgroundColor: '#e5e5ea',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  attendedButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: '#666',
  },
  bookButtonDisabled: {
    backgroundColor: theme.colors.textLight,
  },
  bookButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
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