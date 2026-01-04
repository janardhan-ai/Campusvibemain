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
  Animated
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../data/messages';
import * as ImagePicker from 'expo-image-picker'; // Requires: npx expo install expo-image-picker

type Props = NativeStackScreenProps<HomeStackParamList, 'ChatDetail'>;

interface EnhancedMessage extends Message {
  status?: 'sent' | 'delivered' | 'read';
  type?: 'text' | 'image' | 'voice';
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
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false); 
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingAnim = useRef(new Animated.Value(0)).current; 
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const flatListRef = useRef<FlatList>(null);

  // --- TAB BAR CONTROL ---
  useEffect(() => {
    const parent = navigation.getParent();
    if (parent) parent.setOptions({ tabBarStyle: { display: 'none' } });
    return () => { if (parent) parent.setOptions({ tabBarStyle: { height: 56, paddingBottom: 6, paddingTop: 6, display: 'flex' } }); };
  }, []);

  // --- LOAD MESSAGES ---
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

  // --- SEND HANDLER ---
  const sendGenericMessage = (type: 'text' | 'image' | 'voice', content: string, extraData: any = {}) => {
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
    simulateIncomingMessage();
  };

  // --- REAL DEVICE MEDIA HANDLERS ---
  
  const openGallery = async () => {
    try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission denied", "We need access to your gallery to send photos.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            sendGenericMessage('image', 'Photo', { mediaUrl: result.assets[0].uri });
        }
    } catch (error) {
        // Fallback for Simulator/Web
        sendGenericMessage('image', 'Photo', { mediaUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=600&auto=format&fit=crop' });
    }
  };

  const openCamera = async () => {
    try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission denied", "We need access to your camera.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            sendGenericMessage('image', 'Photo', { mediaUrl: result.assets[0].uri });
        }
    } catch (error) {
        // Fallback for Simulator/Web
        sendGenericMessage('image', 'Photo', { mediaUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop' });
    }
  };

  // --- MIC HANDLERS ---
  const startRecording = () => {
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
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    if (recordingDuration >= 1) {
       const min = Math.floor(recordingDuration / 60);
       const sec = recordingDuration % 60;
       sendGenericMessage('voice', 'Voice Message', { duration: `${min}:${sec < 10 ? '0' : ''}${sec}` });
    }
  };

  const formatDuration = (seconds: number) => {
      const min = Math.floor(seconds / 60);
      const sec = seconds % 60;
      return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const simulateIncomingMessage = () => {
    setTimeout(() => setIsTyping(true), 1500);
    setTimeout(() => {
        setIsTyping(false);
        const replyMsg: EnhancedMessage = {
            id: Date.now().toString(),
            conversation_id: chatId || 'temp_id',
            sender_id: recipient.id,
            sender_name: recipient.name,
            sender_avatar: recipient.avatar,
            content: "That looks amazing! 📸",
            is_read: true,
            created_at: new Date().toISOString(),
            type: 'text',
            status: 'read'
        };
        setCurrentMessages(prev => [...prev, replyMsg]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }, 4000);
  };

  const handleLongPress = (message: EnhancedMessage) => {
    Vibration.vibrate(50);
    Alert.alert("Message Options", undefined, [
        { text: "Reply", onPress: () => setReplyingTo(message) },
        { text: "Copy", onPress: () => console.log("Copied") },
        { text: "Delete", style: "destructive", onPress: () => {
            setCurrentMessages(prev => prev.filter(m => m.id !== message.id));
        }},
        { text: "Cancel", style: "cancel" }
    ]);
  };

  const navigateToProfile = () => {
      // @ts-ignore 
      navigation.navigate('Profile', { user: recipient });
  };

  const renderMessageContent = (item: EnhancedMessage, isMyMessage: boolean) => {
      if (item.type === 'image' && item.mediaUrl) {
          return (
              <View>
                  <Image source={{ uri: item.mediaUrl }} style={styles.mediaImage} />
              </View>
          );
      }
      if (item.type === 'voice') {
          return (
              <View style={styles.voiceContainer}>
                  <Ionicons name="play-circle" size={32} color={isMyMessage ? '#fff' : theme.colors.primary} />
                  <View style={styles.voiceLines}>
                      <View style={[styles.voiceLine, { height: 10, backgroundColor: isMyMessage ? '#fff' : '#ccc' }]} />
                      <View style={[styles.voiceLine, { height: 16, backgroundColor: isMyMessage ? '#fff' : '#ccc' }]} />
                      <View style={[styles.voiceLine, { height: 12, backgroundColor: isMyMessage ? '#fff' : '#ccc' }]} />
                      <View style={[styles.voiceLine, { height: 20, backgroundColor: isMyMessage ? '#fff' : '#ccc' }]} />
                      <View style={[styles.voiceLine, { height: 14, backgroundColor: isMyMessage ? '#fff' : '#ccc' }]} />
                  </View>
                  <Text style={[styles.voiceDuration, { color: isMyMessage ? '#fff' : '#666' }]}>{item.duration}</Text>
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
        
        <TouchableOpacity 
            activeOpacity={0.8} 
            onLongPress={() => handleLongPress(item)}
            style={[styles.messageRow, isMyMessage ? styles.rowRight : styles.rowLeft]}
        >
          {!isMyMessage && (
             <View style={styles.avatarContainer}>
                 {showAvatar ? <Image source={{ uri: item.sender_avatar }} style={styles.avatar} /> : <View style={{width: 28}} />}
             </View>
          )}

          <View style={[
              styles.bubble, 
              isMyMessage ? styles.bubbleRight : styles.bubbleLeft,
              !showAvatar && (isMyMessage ? styles.bubbleRightGroup : styles.bubbleLeftGroup),
              item.type === 'image' && { padding: 4 }
          ]}>
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
          </View>

          {isMyMessage && (
             <View style={styles.avatarContainerRight}>
                 {showAvatar ? <Image source={{ uri: item.sender_avatar }} style={styles.avatar} /> : <View style={{width: 28}} />}
             </View>
          )}
        </TouchableOpacity>
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
        
        <TouchableOpacity style={styles.headerContent} onPress={navigateToProfile} activeOpacity={0.7}>
            <View>
                <Image source={{ uri: recipient.avatar }} style={styles.headerAvatar} />
                <View style={styles.onlineBadge} />
            </View>
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
            ref={flatListRef}
            data={currentMessages}
            keyExtractor={item => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.listContent}
            ListFooterComponent={isTyping ? <View style={{ marginLeft: 50, marginBottom: 10 }}><Text style={{ color: '#999', fontSize: 12, fontStyle: 'italic' }}>{recipient.name} is typing...</Text></View> : null}
            ListEmptyComponent={loading ? null : <View style={styles.emptyState}><Ionicons name="chatbubble-ellipses-outline" size={64} color="#ddd" /><Text style={styles.emptyText}>No messages yet</Text><Text style={styles.emptySub}>Start the conversation with {recipient.name}!</Text></View>}
        />

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
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f2f4f7', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', height: 60, paddingHorizontal: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  backBtn: { padding: 8 },
  headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 5 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eee' },
  onlineBadge: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#4ade80', borderWidth: 1.5, borderColor: '#fff' },
  headerTextContainer: { marginLeft: 10 },
  headerName: { fontSize: 16, fontWeight: '700', color: '#111' },
  headerStatus: { fontSize: 11, color: '#4ade80', fontWeight: '500' },
  headerOption: { padding: 8 },
  listContent: { paddingVertical: 15, paddingHorizontal: 12 },
  dateHeaderContainer: { alignItems: 'center', marginVertical: 12 },
  dateHeaderText: { fontSize: 11, fontWeight: '600', color: '#666', backgroundColor: '#e5e7eb', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
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
  voiceContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 120 },
  voiceLines: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 24 },
  voiceLine: { width: 3, borderRadius: 1.5 },
  voiceDuration: { fontSize: 12, fontWeight: '600' },
  metaContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 2 },
  timeText: { fontSize: 10 },
  timeLight: { color: 'rgba(255,255,255,0.7)' },
  timeDark: { color: '#999' },
  replyContext: { backgroundColor: 'rgba(0,0,0,0.1)', padding: 6, borderRadius: 8, marginBottom: 6, borderLeftWidth: 3, borderLeftColor: 'rgba(0,0,0,0.3)' },
  replyBar: { position: 'absolute' },
  replyName: { fontSize: 11, fontWeight: '700', color: 'rgba(0,0,0,0.6)', marginBottom: 2 },
  replyText: { fontSize: 12, color: 'rgba(0,0,0,0.5)' },
  inputWrapper: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingBottom: Platform.OS === 'ios' ? 20 : 5 },
  replyBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', padding: 8, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#ddd' },
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
  emptySub: { fontSize: 14, color: '#aaa' }
});