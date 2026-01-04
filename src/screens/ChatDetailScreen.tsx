import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert,
  Vibration,
  StatusBar,
  Animated,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
  GestureResponderEvent,
  Linking
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../data/messages';
import * as ImagePicker from 'expo-image-picker'; 
import { Video, ResizeMode, Audio } from 'expo-av'; 
import * as Clipboard from 'expo-clipboard'; 

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<HomeStackParamList, 'ChatDetail'>;

interface Reaction {
  emoji: string;
  count: number;
}

interface EnhancedMessage extends Message {
  status?: 'sent' | 'delivered' | 'read';
  type?: 'text' | 'image' | 'video' | 'voice' | 'deleted'; 
  mediaUrl?: string; 
  duration?: string; 
  replyTo?: EnhancedMessage;
  is_edited?: boolean; // NEW: Track edits
  reactions?: Reaction[]; // NEW: Track reactions
}

const getRelativeDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === now.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// --- MOCK UPLOAD FUNCTION ---
const uploadToStorage = async (localUri: string, type: 'image' | 'video' | 'voice') => {
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    return localUri; 
};

export const ChatDetailScreen = ({ route, navigation }: Props) => {
  const params = route.params as any; 
  const { currentUser } = useApp();
  
  let recipient = params.recipient;
  if (!recipient && params.userId) recipient = { id: params.userId, name: params.userName, avatar: params.userAvatar, username: 'User' };
  
  if (!recipient) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;

  const chatId = params.chatId;

  // --- STATE ---
  const [currentMessages, setCurrentMessages] = useState<EnhancedMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false); 
  const [replyingTo, setReplyingTo] = useState<EnhancedMessage | null>(null); 
  
  // Edit State
  const [editingMessage, setEditingMessage] = useState<EnhancedMessage | null>(null);

  // Modals & Menus
  const [fullScreenMedia, setFullScreenMedia] = useState<{ url: string, type: 'image' | 'video' } | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<EnhancedMessage | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, alignRight: false });

  // Recording & Playback
  const [isRecording, setIsRecording] = useState(false); 
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingAnim = useRef(new Animated.Value(0)).current; 
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const playbackAnim = useRef(new Animated.Value(0)).current;

  const flatListRef = useRef<FlatList>(null);

  // --- SETUP ---
  useEffect(() => {
    // Audio Setup
    const setupAudio = async () => {
      try { await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true }); } 
      catch (e) { console.log(e); }
    };
    setupAudio();

    // Navigation Bar
    const parent = navigation.getParent();
    if (parent) parent.setOptions({ tabBarStyle: { display: 'none' } });
    return () => { 
        if (parent) parent.setOptions({ tabBarStyle: { height: 56, paddingBottom: 6, paddingTop: 6, display: 'flex' } });
        if (sound) sound.unloadAsync();
    };
  }, []);

  useEffect(() => {
    // Load Dummy Data or Fetch
    const targetMessages: EnhancedMessage[] = []; 
    // In real app, fetch here. For now we start empty or with params.
    setCurrentMessages(targetMessages);
    setLoading(false);
  }, [chatId]);

  // --- NEW: LINK PARSING FUNCTION ---
  const renderTextWithLinks = (text: string, isMyMessage: boolean) => {
    // Split text by URLs
    const parts = text.split(/(https?:\/\/[^\s]+)/g);
    
    return (
        <Text style={[styles.messageText, isMyMessage ? styles.textDark : styles.textDark]}>
            {parts.map((part, index) => {
                if (part.match(/https?:\/\/[^\s]+/g)) {
                    return (
                        <Text 
                            key={index} 
                            style={{ color: '#007AFF', textDecorationLine: 'underline' }}
                            onPress={() => Linking.openURL(part)}
                        >
                            {part}
                        </Text>
                    );
                }
                return <Text key={index}>{part}</Text>;
            })}
        </Text>
    );
  };

  // --- NEW: REACTION LOGIC ---
  const handleReaction = (emoji: string) => {
      if (!selectedMessage) return;
      
      setCurrentMessages(prev => prev.map(m => {
          if (m.id === selectedMessage.id) {
              const existingReactions = m.reactions || [];
              // Simple toggle logic (append for now)
              return { ...m, reactions: [...existingReactions, { emoji, count: 1 }] };
          }
          return m;
      }));
      setMenuVisible(false);
      setSelectedMessage(null);
  };

  // --- MENU LOGIC ---
  const handleLongPress = (event: GestureResponderEvent, message: EnhancedMessage) => {
    if (message.type === 'deleted') return;
    Vibration.vibrate(50);
    
    const { pageY } = event.nativeEvent;
    const isMyMessage = message.sender_id === currentUser?.id;
    const showAbove = pageY > height - 250; // Adjusted threshold
    
    setMenuPosition({
        top: showAbove ? pageY - 180 : pageY + 10,
        left: isMyMessage ? width - 200 : 20,
        alignRight: isMyMessage
    });

    setSelectedMessage(message);
    setMenuVisible(true);
  };

  const handleMenuAction = (action: 'reply' | 'copy' | 'edit' | 'delete') => {
      if (!selectedMessage) return;

      if (action === 'reply') {
          setReplyingTo(selectedMessage);
      } 
      else if (action === 'copy') {
          if (selectedMessage.type === 'text') Clipboard.setStringAsync(selectedMessage.content);
      }
      else if (action === 'edit') {
          // NEW: Activate Edit Mode
          setEditingMessage(selectedMessage);
          setMessageText(selectedMessage.content);
      }
      else if (action === 'delete') {
          const isMyMessage = selectedMessage.sender_id === currentUser?.id;
          handleDeleteConfirm(selectedMessage, isMyMessage);
      }
      setMenuVisible(false);
      setSelectedMessage(null);
  };

  const handleDeleteConfirm = (message: EnhancedMessage, isMyMessage: boolean) => {
      Alert.alert("Delete Message?", isMyMessage ? "Choose an option" : "Remove for yourself only", [
          { text: "Delete for me", onPress: () => setCurrentMessages(p => p.filter(m => m.id !== message.id)) },
          isMyMessage ? { text: "Delete for everyone", onPress: () => setCurrentMessages(p => p.map(m => m.id === message.id ? { ...m, type: 'deleted', content: "🚫 This message was deleted", mediaUrl: undefined } : m)), style: "destructive" } : { text: "", style: "cancel" },
          { text: "Cancel", style: "cancel" }
      ].filter(o => o.text !== "") as any);
  };

  // --- SEND / EDIT LOGIC ---
  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    // 1. EDIT MODE
    if (editingMessage) {
        setCurrentMessages(prev => prev.map(m => 
            m.id === editingMessage.id 
                ? { ...m, content: messageText, is_edited: true } 
                : m
        ));
        setEditingMessage(null);
        setMessageText('');
        return;
    }

    // 2. NORMAL SEND
    sendGenericMessage('text', messageText);
    simulateIncomingMessage();
  };

  const sendGenericMessage = async (type: 'text' | 'image' | 'video' | 'voice', content: string, extraData: any = {}) => {
    const tempId = Date.now().toString();
    const newMessage: EnhancedMessage = {
      id: tempId,
      conversation_id: chatId || 'temp_id',
      sender_id: currentUser?.id || 'current-user',
      sender_name: currentUser?.name || 'You',
      sender_avatar: currentUser?.avatar || 'https://i.pravatar.cc/150?img=11',
      content: content,
      is_read: false,
      created_at: new Date().toISOString(),
      status: 'sent', 
      type: type,
      replyTo: replyingTo || undefined, 
      ...extraData 
    };

    setCurrentMessages(prev => [...prev, newMessage]);
    setMessageText('');
    setReplyingTo(null);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    // Mock Upload/Send Process
    try {
        let finalMediaUrl = extraData.mediaUrl;
        if (type !== 'text' && extraData.mediaUrl) {
            finalMediaUrl = await uploadToStorage(extraData.mediaUrl, type);
        }
        await new Promise(resolve => setTimeout(resolve, 500)); 
        setCurrentMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'delivered', mediaUrl: finalMediaUrl } : m));
        setTimeout(() => setCurrentMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'read' } : m)), 3000);
    } catch (error) { console.error("Send failed"); }
  };

  // --- RENDERERS ---
  const renderMessageContent = (item: EnhancedMessage, isMyMessage: boolean) => {
      if (item.type === 'deleted') return <Text style={{fontStyle:'italic', color:'#888'}}>{item.content}</Text>;
      
      if ((item.type === 'image' || item.type === 'video') && item.mediaUrl) {
          return (
              <TouchableOpacity onPress={() => setFullScreenMedia({ url: item.mediaUrl!, type: item.type as any })}>
                  {item.type === 'video' ? (
                      <View>
                         <Video source={{ uri: item.mediaUrl! }} style={styles.mediaImage} resizeMode={ResizeMode.COVER} shouldPlay={false} />
                         <View style={styles.videoOverlay}><Ionicons name="play-circle" size={40} color="rgba(255,255,255,0.8)" /></View>
                      </View>
                  ) : <Image source={{ uri: item.mediaUrl }} style={styles.mediaImage} />}
              </TouchableOpacity>
          );
      }
      
      if (item.type === 'voice') {
          const isPlaying = playingAudioId === item.id;
          const progressWidth = isPlaying ? playbackAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) : '0%';
          return (
              <View style={styles.voiceContainer}>
                  <TouchableOpacity onPress={() => {/* Play Logic */}}>
                      <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={36} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <View style={styles.voiceWaveform}>
                      <View style={[styles.voiceTrack, { backgroundColor: isMyMessage ? '#CFD8DC' : '#ddd' }]}>
                          <Animated.View style={[styles.voiceProgress, { width: progressWidth as any, backgroundColor: theme.colors.primary } ]} />
                      </View>
                      <Text style={{color: '#666', fontSize: 11}}>{item.duration}</Text>
                  </View>
              </View>
          );
      }

      // CLICKABLE LINKS
      return renderTextWithLinks(item.content, isMyMessage);
  };

  const renderMessageItem = ({ item, index }: { item: EnhancedMessage; index: number }) => {
    const isMyMessage = item.sender_id === currentUser?.id;
    const showAvatar = index === currentMessages.length - 1 || currentMessages[index + 1]?.sender_id !== item.sender_id;
    const currentDate = getRelativeDate(item.created_at);
    const prevDate = index > 0 ? getRelativeDate(currentMessages[index - 1].created_at) : null;

    return (
      <View>
        {currentDate !== prevDate && <View style={styles.dateHeaderContainer}><Text style={styles.dateHeaderText}>{currentDate}</Text></View>}
        <View style={[styles.messageRow, isMyMessage ? styles.rowRight : styles.rowLeft]}>
          {!isMyMessage && (
             <View style={styles.avatarContainer}>
                 {showAvatar ? <Image source={{ uri: item.sender_avatar }} style={styles.avatar} /> : <View style={{width: 28}} />}
             </View>
          )}
          <TouchableOpacity 
              activeOpacity={0.8}
              onLongPress={(e) => handleLongPress(e, item)}
              style={[
                  styles.bubble, 
                  isMyMessage ? styles.bubbleRight : styles.bubbleLeft,
                  !showAvatar && (isMyMessage ? styles.bubbleRightGroup : styles.bubbleLeftGroup),
                  (item.type === 'image' || item.type === 'video') && { padding: 4 }
              ]}
          >
             {item.replyTo && (
                 <View style={styles.replyContext}>
                     <View style={styles.replyBar} />
                     <Text style={styles.replyName}>{item.replyTo.sender_id === currentUser?.id ? 'You' : item.replyTo.sender_name}</Text>
                     <Text style={styles.replyText} numberOfLines={1}>{item.replyTo.content}</Text>
                 </View>
             )}
             
             {renderMessageContent(item, isMyMessage)}
             
             <View style={styles.metaContainer}>
                 <Text style={[styles.timeText, styles.textDark]}>
                     {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     {item.is_edited && " • Edited"}
                 </Text>
                 {isMyMessage && item.type !== 'deleted' && (
                     <Ionicons name={item.status === 'read' ? "checkmark-done" : "checkmark"} size={14} color={item.status === 'read' ? theme.colors.primary : '#999'} style={{ marginLeft: 4 }} />
                 )}
             </View>

             {/* REACTIONS DISPLAY */}
             {item.reactions && item.reactions.length > 0 && (
                 <View style={styles.reactionsContainer}>
                     {item.reactions.map((r, i) => (
                         <Text key={i} style={{fontSize: 12}}>{r.emoji}</Text>
                     ))}
                 </View>
             )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // --- HELPERS (Copied from before to save space in render) ---
  const simulateIncomingMessage = () => { /* ... */ };
  const openGallery = async () => { /* ... */ };
  const openCamera = async () => { /* ... */ };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#000"/></TouchableOpacity>
        <View style={styles.headerContent}>
            <Image source={{ uri: recipient.avatar }} style={styles.headerAvatar} />
            <View style={styles.headerTextContainer}><Text style={styles.headerName}>{recipient.name}</Text><Text style={styles.headerStatus}>Active now</Text></View>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
            ref={flatListRef}
            data={currentMessages}
            keyExtractor={item => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.listContent}
        />

        {/* INPUT AREA */}
        <View style={styles.inputWrapper}>
            {/* EDITING / REPLYING BANNER */}
            {(replyingTo || editingMessage) && (
                <View style={styles.replyBanner}>
                    <View style={{flex: 1}}>
                        <Text style={styles.replyBannerTitle}>{editingMessage ? "Editing Message" : `Replying to ${replyingTo?.sender_name}`}</Text>
                        <Text style={styles.replyBannerText} numberOfLines={1}>
                            {editingMessage ? editingMessage.content : replyingTo?.content}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => { setReplyingTo(null); setEditingMessage(null); setMessageText(''); }}>
                        <Ionicons name="close" size={20} color="#666" />
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.inputBar}>
                <TextInput
                    style={styles.input}
                    placeholder="Message..."
                    value={messageText}
                    onChangeText={setMessageText}
                    multiline
                />
                <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}>
                    {editingMessage ? <Ionicons name="checkmark" size={20} color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
                </TouchableOpacity>
            </View>
        </View>
      </KeyboardAvoidingView>

      {/* --- POPUP MENU (With Reactions) --- */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
            <View style={styles.menuOverlay}>
                <View style={[styles.popupMenu, { top: menuPosition.top, left: menuPosition.alignRight ? undefined : 20, right: menuPosition.alignRight ? 20 : undefined }]}>
                    
                    {/* REACTION ROW */}
                    <View style={styles.reactionRow}>
                        {['❤️', '😂', '👍', '🔥', '😢'].map(emoji => (
                            <TouchableOpacity key={emoji} onPress={() => handleReaction(emoji)} style={{padding: 5}}>
                                <Text style={{fontSize: 22}}>{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.divider} />

                    {/* MENU OPTIONS */}
                    <TouchableOpacity style={styles.popupItem} onPress={() => handleMenuAction('reply')}>
                        <Text style={styles.popupText}>Reply</Text>
                        <Ionicons name="arrow-undo-outline" size={18} color="#333" />
                    </TouchableOpacity>
                    
                    {selectedMessage?.type === 'text' && (
                        <TouchableOpacity style={styles.popupItem} onPress={() => handleMenuAction('copy')}>
                            <Text style={styles.popupText}>Copy</Text>
                            <Ionicons name="copy-outline" size={18} color="#333" />
                        </TouchableOpacity>
                    )}

                    {/* EDIT OPTION (Only for My Text Messages) */}
                    {selectedMessage?.sender_id === currentUser?.id && selectedMessage.type === 'text' && (
                        <TouchableOpacity style={styles.popupItem} onPress={() => handleMenuAction('edit')}>
                            <Text style={styles.popupText}>Edit</Text>
                            <Ionicons name="pencil-outline" size={18} color="#333" />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={[styles.popupItem, { borderBottomWidth: 0 }]} onPress={() => handleMenuAction('delete')}>
                        <Text style={[styles.popupText, { color: '#FF3B30' }]}>Delete</Text>
                        <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* FULL SCREEN MEDIA */}
      <Modal visible={!!fullScreenMedia} transparent animationType="fade" onRequestClose={() => setFullScreenMedia(null)}>
          <View style={styles.fullScreenContainer}>
              <TouchableOpacity style={styles.fullScreenClose} onPress={() => setFullScreenMedia(null)}><Ionicons name="close" size={30} color="#fff" /></TouchableOpacity>
              {fullScreenMedia && <Image source={{ uri: fullScreenMedia.url }} style={styles.fullScreenImage} resizeMode="contain" />}
          </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f2f4f7', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', height: 60, paddingHorizontal: 10, elevation: 2 },
  backBtn: { padding: 8 },
  headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 5 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eee' },
  headerTextContainer: { marginLeft: 10 },
  headerName: { fontSize: 16, fontWeight: '700', color: '#111' },
  headerStatus: { fontSize: 11, color: '#4ade80', fontWeight: '500' },
  headerOption: { padding: 8 },
  listContent: { paddingVertical: 15, paddingHorizontal: 12 },
  messageRow: { flexDirection: 'row', marginBottom: 2, alignItems: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  avatarContainer: { width: 28, marginRight: 8, paddingBottom: 4 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ccc' },
  bubble: { maxWidth: '75%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, elevation: 1 },
  bubbleLeft: { backgroundColor: '#fff', borderBottomLeftRadius: 4 },
  bubbleRight: { backgroundColor: '#E9EFF5', borderBottomRightRadius: 4 }, 
  bubbleLeftGroup: { borderBottomLeftRadius: 18, marginBottom: 2 },
  bubbleRightGroup: { borderBottomRightRadius: 18, marginBottom: 2 },
  messageText: { fontSize: 15, lineHeight: 21 },
  textDark: { color: '#111' },
  mediaImage: { width: 200, height: 150, borderRadius: 12, resizeMode: 'cover' },
  videoOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12 },
  voiceContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 150 },
  voiceWaveform: { flex: 1 },
  voiceTrack: { height: 4, width: '100%', backgroundColor: '#eee', borderRadius: 2, marginBottom: 4, overflow: 'hidden' },
  voiceProgress: { height: '100%', backgroundColor: theme.colors.primary },
  metaContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 2 },
  timeText: { fontSize: 10 },
  replyContext: { backgroundColor: 'rgba(0,0,0,0.05)', padding: 6, borderRadius: 8, marginBottom: 6, borderLeftWidth: 3, borderLeftColor: theme.colors.primary },
  replyBar: { position: 'absolute' },
  replyName: { fontSize: 11, fontWeight: '700', color: theme.colors.primary, marginBottom: 2 },
  replyText: { fontSize: 12, color: '#666' },
  inputWrapper: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingBottom: Platform.OS === 'ios' ? 20 : 5 },
  replyBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 8, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  replyBannerTitle: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
  replyBannerText: { fontSize: 12, color: '#666' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 8, paddingHorizontal: 12 },
  input: { flex: 1, backgroundColor: '#f2f4f7', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, maxHeight: 100, marginRight: 8, color: '#000' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#888', marginTop: 10 },
  dateHeaderContainer: { alignItems: 'center', marginVertical: 12 },
  dateHeaderText: { fontSize: 11, fontWeight: '600', color: '#666', backgroundColor: '#e5e7eb', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  fullScreenContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  fullScreenImage: { width: width, height: height * 0.8 },
  fullScreenClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
  
  // POPUP MENU
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' },
  popupMenu: { position: 'absolute', width: 180, backgroundColor: 'white', borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5, paddingVertical: 5 },
  reactionRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 8 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 2 },
  popupItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  popupText: { fontSize: 16, color: '#333', fontWeight: '500' },
  reactionsContainer: { flexDirection: 'row', position: 'absolute', bottom: -10, left: 10, backgroundColor: '#fff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: '#eee', elevation: 1 }
});