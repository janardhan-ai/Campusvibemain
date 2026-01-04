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
  Dimensions
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../data/messages';
import * as ImagePicker from 'expo-image-picker'; 
import { Video, ResizeMode, Audio } from 'expo-av'; 

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<HomeStackParamList, 'ChatDetail'>;

interface EnhancedMessage extends Message {
  status?: 'sent' | 'delivered' | 'read';
  type?: 'text' | 'image' | 'video' | 'voice';
  mediaUrl?: string; 
  duration?: string; 
  replyTo?: EnhancedMessage;
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

export const ChatDetailScreen = ({ route, navigation }: Props) => {
  const params = route.params as any; 
  const { currentUser, messages } = useApp();
  const allChats = messages || []; 
  
  let recipient = params.recipient;
  if (!recipient && params.userId) recipient = { id: params.userId, name: params.userName, avatar: params.userAvatar, username: 'User' };
  if (!recipient && params.chatId) {
     const chat = allChats.find(c => c.id === params.chatId);
     if (chat) recipient = chat.participants.find(p => p.id !== currentUser?.id);
  }
  
  if (!recipient) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;

  const chatId = params.chatId;

  // --- STATE ---
  const [currentMessages, setCurrentMessages] = useState<EnhancedMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false); 
  const [replyingTo, setReplyingTo] = useState<EnhancedMessage | null>(null); 
  const [fullScreenMedia, setFullScreenMedia] = useState<{ url: string, type: 'image' | 'video' } | null>(null);

  // --- RECORDING STATE (REAL) ---
  const [isRecording, setIsRecording] = useState(false); // <--- FIXED: Added this missing line
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingAnim = useRef(new Animated.Value(0)).current; 
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- PLAYBACK STATE (REAL) ---
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const playbackAnim = useRef(new Animated.Value(0)).current;

  const flatListRef = useRef<FlatList>(null);

  // --- SETUP AUDIO MODE ---
  useEffect(() => {
    async function setupAudio() {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.log("Audio setup failed", e);
      }
    }
    setupAudio();

    const parent = navigation.getParent();
    if (parent) parent.setOptions({ tabBarStyle: { display: 'none' } });
    return () => { 
        if (parent) parent.setOptions({ tabBarStyle: { height: 56, paddingBottom: 6, paddingTop: 6, display: 'flex' } });
        if (sound) sound.unloadAsync();
    };
  }, []);

  useEffect(() => {
    let targetMessages: EnhancedMessage[] = [];
    if (chatId) {
       const chat = allChats.find(c => c.id === chatId);
       if (chat) targetMessages = chat.messages.map(m => ({...m, status: 'read', type: 'text'}));
    } else {
       const existingChat = allChats.find(c => c.participants.some(p => p.id === recipient.id));
       if (existingChat) targetMessages = existingChat.messages.map(m => ({...m, status: 'read', type: 'text'}));
    }
    setCurrentMessages(targetMessages);
    setLoading(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
  }, [chatId, recipient.id]);

  // --- MEDIA HANDLERS ---
  const handleMediaPress = (url: string, type: 'image' | 'video') => {
      setFullScreenMedia({ url, type });
  };

  // --- REAL AUDIO PLAYBACK ---
  const handlePlayAudio = async (messageId: string, uri: string) => {
      if (playingAudioId === messageId) {
          await stopAudioPlayback();
          return;
      }

      await stopAudioPlayback();

      try {
          const { sound: newSound } = await Audio.Sound.createAsync(
              { uri: uri },
              { shouldPlay: true } 
          );
          
          setSound(newSound);
          setPlayingAudioId(messageId);

          newSound.setOnPlaybackStatusUpdate((status) => {
              if (status.isLoaded) {
                  if (status.didJustFinish) {
                      stopAudioPlayback();
                  } else {
                      const progress = status.positionMillis / (status.durationMillis || 1);
                      playbackAnim.setValue(progress);
                  }
              }
          });

      } catch (error) {
          console.log("Error playing audio:", error);
          Alert.alert("Error", "Could not play audio file.");
      }
  };

  const stopAudioPlayback = async () => {
      if (sound) {
          await sound.unloadAsync();
          setSound(null);
      }
      setPlayingAudioId(null);
      playbackAnim.setValue(0);
  };

  // --- SEND LOGIC ---
  const sendGenericMessage = (type: 'text' | 'image' | 'video' | 'voice', content: string, extraData: any = {}) => {
    const newMessage: EnhancedMessage = {
      id: Date.now().toString(),
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
    
    setTimeout(() => { setCurrentMessages(prev => prev.map(m => m.id === newMessage.id ? {...m, status: 'delivered'} : m)); }, 1000);
    setTimeout(() => { setCurrentMessages(prev => prev.map(m => m.id === newMessage.id ? {...m, status: 'read'} : m)); }, 2500);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    sendGenericMessage('text', messageText);
  };

  const openGallery = async () => {
    try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert("Permission denied"); return; }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All, 
            allowsEditing: true, quality: 1,
        });
        if (!result.canceled) {
            const asset = result.assets[0];
            const type = asset.type === 'video' ? 'video' : 'image';
            sendGenericMessage(type, type === 'video' ? 'Video' : 'Photo', { mediaUrl: asset.uri });
        }
    } catch (error) { console.log(error); }
  };

  const openCamera = async () => {
    try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert("Permission denied"); return; }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true, quality: 1,
        });
        if (!result.canceled) {
            sendGenericMessage('image', 'Photo', { mediaUrl: result.assets[0].uri });
        }
    } catch (error) { console.log(error); }
  };

  // --- REAL RECORDING LOGIC ---
  const startRecording = async () => {
    try {
        const perm = await Audio.requestPermissionsAsync();
        if (perm.status !== "granted") return;

        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
        });

        Vibration.vibrate(50);
        setIsRecording(true);
        setRecordingDuration(0);
        
        timerRef.current = setInterval(() => { setRecordingDuration(prev => prev + 1); }, 1000);
        
        Animated.loop(
            Animated.sequence([
                Animated.timing(recordingAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(recordingAnim, { toValue: 0, duration: 500, useNativeDriver: true })
            ])
        ).start();

        const { recording: newRecording } = await Audio.Recording.createAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(newRecording);

    } catch (err) {
        console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    recordingAnim.stopAnimation();
    
    if (!recording) return;
    
    try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI(); 
        
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
        });

        setRecording(null);

        if (recordingDuration >= 1 && uri) {
            const min = Math.floor(recordingDuration / 60);
            const sec = recordingDuration % 60;
            const durationStr = `${min}:${sec < 10 ? '0' : ''}${sec}`;
            sendGenericMessage('voice', 'Voice Message', { 
                mediaUrl: uri, 
                duration: durationStr 
            });
        }
    } catch (error) {
        console.log("Error stopping recording", error);
    }
  };

  const formatDuration = (seconds: number) => {
      const min = Math.floor(seconds / 60);
      const sec = seconds % 60;
      return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // --- RENDERERS ---
  const renderMessageContent = (item: EnhancedMessage, isMyMessage: boolean) => {
      if ((item.type === 'image' || item.type === 'video') && item.mediaUrl) {
          return (
              <TouchableOpacity onPress={() => handleMediaPress(item.mediaUrl!, item.type as any)}>
                  {item.type === 'video' ? (
                      <View>
                         <Video
                            source={{ uri: item.mediaUrl! }}
                            style={styles.mediaImage}
                            resizeMode={ResizeMode.COVER}
                            useNativeControls={false}
                            shouldPlay={false} 
                         />
                         <View style={styles.videoOverlay}>
                             <Ionicons name="play-circle" size={40} color="rgba(255,255,255,0.8)" />
                         </View>
                      </View>
                  ) : (
                      <Image source={{ uri: item.mediaUrl }} style={styles.mediaImage} />
                  )}
              </TouchableOpacity>
          );
      }
      
      if (item.type === 'voice') {
          const isPlaying = playingAudioId === item.id;
          const progressWidth = isPlaying ? playbackAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%']
          }) : '0%';

          return (
              <View style={styles.voiceContainer}>
                  <TouchableOpacity onPress={() => handlePlayAudio(item.id, item.mediaUrl!)}>
                      <Ionicons 
                        name={isPlaying ? "pause-circle" : "play-circle"} 
                        size={36} 
                        color={isMyMessage ? '#fff' : theme.colors.primary} 
                      />
                  </TouchableOpacity>
                  
                  <View style={styles.voiceWaveform}>
                      <View style={[styles.voiceTrack, { backgroundColor: isMyMessage ? 'rgba(255,255,255,0.3)' : '#ddd' }]}>
                          <Animated.View style={[
                              styles.voiceProgress, 
                              { 
                                  width: progressWidth as any,
                                  backgroundColor: isMyMessage ? '#fff' : theme.colors.primary 
                              } 
                          ]} />
                      </View>
                      <Text style={[styles.voiceDuration, { color: isMyMessage ? '#fff' : '#666' }]}>
                          {item.duration || '0:00'}
                      </Text>
                  </View>
              </View>
          );
      }

      return (
          <Text style={[styles.messageText, isMyMessage ? styles.textLight : styles.textDark]}>
              {item.content}
          </Text>
      );
  };

  const renderMessageItem = ({ item, index }: { item: EnhancedMessage; index: number }) => {
    const isMyMessage = item.sender_id === currentUser?.id;
    const showAvatar = index === currentMessages.length - 1 || currentMessages[index + 1]?.sender_id !== item.sender_id;
    const currentDate = getRelativeDate(item.created_at);
    const prevDate = index > 0 ? getRelativeDate(currentMessages[index - 1].created_at) : null;
    const showDateHeader = currentDate !== prevDate;

    return (
      <View>
        {showDateHeader && (
            <View style={styles.dateHeaderContainer}>
                <Text style={styles.dateHeaderText}>{currentDate}</Text>
            </View>
        )}
        
        <View style={[styles.messageRow, isMyMessage ? styles.rowRight : styles.rowLeft]}>
          {!isMyMessage && (
             <View style={styles.avatarContainer}>
                 {showAvatar ? <Image source={{ uri: item.sender_avatar }} style={styles.avatar} /> : <View style={{width: 28}} />}
             </View>
          )}

          <TouchableOpacity 
              activeOpacity={0.8}
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
                     <Text style={styles.replyText} numberOfLines={1}>
                         {item.replyTo.type === 'image' ? '📷 Photo' : item.replyTo.type === 'voice' ? '🎤 Voice Message' : item.replyTo.content}
                     </Text>
                 </View>
             )}

             {renderMessageContent(item, isMyMessage)}
             
             <View style={styles.metaContainer}>
                 <Text style={[styles.timeText, isMyMessage ? styles.timeLight : styles.timeDark]}>
                     {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </Text>
                 {isMyMessage && (
                     <Ionicons 
                        name={item.status === 'read' ? "checkmark-done" : "checkmark"} 
                        size={14} 
                        color={item.status === 'read' ? '#bbf7d0' : 'rgba(255,255,255,0.7)'} 
                        style={{ marginLeft: 4 }}
                     />
                 )}
             </View>
          </TouchableOpacity>

          {isMyMessage && (
             <View style={styles.avatarContainerRight}>
                 {showAvatar ? <Image source={{ uri: item.sender_avatar }} style={styles.avatar} /> : <View style={{width: 28}} />}
             </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerContent} onPress={() => navigation.navigate('Profile' as any, { user: recipient })}>
            <Image source={{ uri: recipient.avatar }} style={styles.headerAvatar} />
            <View style={styles.headerTextContainer}>
                <Text style={styles.headerName}>{recipient.name}</Text>
                <Text style={styles.headerStatus}>{isTyping ? 'typing...' : 'Active now'}</Text>
            </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerOption}><Ionicons name="videocam-outline" size={24} color={theme.colors.text} /></TouchableOpacity>
        <TouchableOpacity style={styles.headerOption}><Ionicons name="call-outline" size={22} color={theme.colors.text} /></TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
            ref={flatListRef}
            data={currentMessages}
            keyExtractor={item => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={loading ? null : <View style={styles.emptyState}><Ionicons name="chatbubble-ellipses-outline" size={64} color="#ddd" /><Text style={styles.emptyText}>No messages yet</Text></View>}
        />

        {/* INPUT */}
        <View style={styles.inputWrapper}>
            {replyingTo && (
                <View style={styles.replyBanner}>
                    <View style={{flex: 1}}>
                        <Text style={styles.replyBannerTitle}>Replying to {replyingTo.sender_id === currentUser?.id ? 'Yourself' : replyingTo.sender_name}</Text>
                        <Text style={styles.replyBannerText} numberOfLines={1}>{replyingTo.type === 'image' ? '📷 Photo' : replyingTo.type === 'voice' ? '🎤 Voice Message' : replyingTo.content}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setReplyingTo(null)}><Ionicons name="close" size={20} color="#666" /></TouchableOpacity>
                </View>
            )}

            <View style={styles.inputBar}>
                {isRecording ? (
                    <View style={styles.recordingContainer}>
                        <Animated.View style={{ opacity: recordingAnim, marginRight: 10 }}>
                            <View style={styles.redDot} />
                        </Animated.View>
                        <Text style={styles.recordingText}>{formatDuration(recordingDuration)}</Text>
                        <Text style={styles.recordingHint}>Recording...</Text>
                    </View>
                ) : (
                    <>
                        <TouchableOpacity style={styles.attachBtn} onPress={openGallery}>
                            <Ionicons name="add" size={28} color={theme.colors.primary} />
                        </TouchableOpacity>
                        
                        <View style={styles.inputFieldContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Message..."
                                value={messageText}
                                onChangeText={setMessageText}
                                multiline
                                maxLength={1000}
                            />
                            {!messageText && (
                                <TouchableOpacity style={styles.mediaBtn} onPress={openCamera}>
                                    <Ionicons name="camera-outline" size={24} color="#999" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </>
                )}

                <TouchableOpacity 
                    style={[styles.sendBtn, (!messageText.trim() && !isRecording) && styles.micBtn]} 
                    onPress={messageText.trim() ? handleSendMessage : undefined}
                    onLongPress={!messageText.trim() ? startRecording : undefined}
                    onPressOut={!messageText.trim() ? stopRecording : undefined}
                >
                    {messageText.trim() ? (
                        <Ionicons name="send" size={18} color="#fff" style={{ marginLeft: 2 }} />
                    ) : (
                        <Ionicons name="mic" size={22} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>
        </View>
      </KeyboardAvoidingView>

      {/* FULL SCREEN MEDIA MODAL */}
      <Modal visible={!!fullScreenMedia} transparent animationType="fade" onRequestClose={() => setFullScreenMedia(null)}>
          <View style={styles.fullScreenContainer}>
              <TouchableOpacity style={styles.fullScreenClose} onPress={() => setFullScreenMedia(null)}>
                  <Ionicons name="close" size={30} color="#fff" />
              </TouchableOpacity>
              
              {fullScreenMedia?.type === 'video' ? (
                  <Video
                      source={{ uri: fullScreenMedia.url }}
                      style={styles.fullScreenImage}
                      resizeMode={ResizeMode.CONTAIN}
                      useNativeControls
                      shouldPlay
                      isLooping
                  />
              ) : (
                  fullScreenMedia && (
                      <Image source={{ uri: fullScreenMedia.url }} style={styles.fullScreenImage} resizeMode="contain" />
                  )
              )}
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
  onlineBadge: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#4ade80', borderWidth: 1.5, borderColor: '#fff' },
  listContent: { paddingVertical: 15, paddingHorizontal: 12 },
  messageRow: { flexDirection: 'row', marginBottom: 2, alignItems: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  avatarContainer: { width: 28, marginRight: 8, paddingBottom: 4 },
  avatarContainerRight: { width: 28, marginLeft: 8, paddingBottom: 4 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ccc' },
  bubble: { maxWidth: '75%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, elevation: 1 },
  bubbleLeft: { backgroundColor: '#fff', borderBottomLeftRadius: 4 },
  bubbleLeftGroup: { borderBottomLeftRadius: 18, marginBottom: 2 },
  bubbleRight: { backgroundColor: theme.colors.primary, borderBottomRightRadius: 4 },
  bubbleRightGroup: { borderBottomRightRadius: 18, marginBottom: 2 },
  messageText: { fontSize: 15, lineHeight: 21 },
  textLight: { color: '#fff' },
  textDark: { color: '#111' },
  mediaImage: { width: 200, height: 150, borderRadius: 12, resizeMode: 'cover' },
  videoOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12 },
  voiceContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 150 },
  voiceWaveform: { flex: 1 },
  voiceTrack: { height: 4, width: '100%', backgroundColor: '#eee', borderRadius: 2, marginBottom: 4, overflow: 'hidden' },
  voiceProgress: { height: '100%', backgroundColor: theme.colors.primary },
  voiceDuration: { fontSize: 11, color: '#666' },
  metaContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 2 },
  timeText: { fontSize: 10 },
  timeLight: { color: 'rgba(255,255,255,0.7)' },
  timeDark: { color: '#999' },
  replyContext: { backgroundColor: 'rgba(0,0,0,0.1)', padding: 6, borderRadius: 8, marginBottom: 6, borderLeftWidth: 3, borderLeftColor: 'rgba(0,0,0,0.3)' },
  replyBar: { position: 'absolute' },
  replyName: { fontSize: 11, fontWeight: '700', color: 'rgba(0,0,0,0.6)', marginBottom: 2 },
  replyText: { fontSize: 12, color: 'rgba(0,0,0,0.5)' },
  inputWrapper: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingBottom: Platform.OS === 'ios' ? 20 : 5 },
  replyBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', padding: 8, paddingHorizontal: 16 },
  replyBannerTitle: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
  replyBannerText: { fontSize: 12, color: '#666' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 8, paddingHorizontal: 12 },
  attachBtn: { padding: 10, justifyContent: 'center', alignItems: 'center' },
  inputFieldContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f2f4f7', borderRadius: 24, marginHorizontal: 8, paddingHorizontal: 12, minHeight: 44, paddingVertical: 2 },
  input: { flex: 1, maxHeight: 100, fontSize: 16, paddingVertical: 8, color: '#000' },
  mediaBtn: { padding: 8 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  micBtn: { backgroundColor: theme.colors.primary },
  recordingContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 44 },
  redDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#ff3b30' },
  recordingText: { fontSize: 16, color: '#ff3b30', fontWeight: '600' },
  recordingHint: { fontSize: 14, color: '#999' },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#888', marginTop: 10 },
  dateHeaderContainer: { alignItems: 'center', marginVertical: 12 },
  dateHeaderText: { fontSize: 11, fontWeight: '600', color: '#666', backgroundColor: '#e5e7eb', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  fullScreenContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  fullScreenImage: { width: width, height: height * 0.8 },
  fullScreenClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
});