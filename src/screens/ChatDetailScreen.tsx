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
  Vibration
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../data/messages';

type Props = NativeStackScreenProps<HomeStackParamList, 'ChatDetail'>;

// --- EXTENDED TYPES FOR UI ---
// Extending the base Message type to support local-only features like 'status'
interface EnhancedMessage extends Message {
  status?: 'sent' | 'delivered' | 'read';
  type?: 'text' | 'image';
  replyTo?: EnhancedMessage;
}

// Helper to group messages by date
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
  
  // --- RECIPIENT RESOLVER ---
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
  const [isTyping, setIsTyping] = useState(false); // New: Typing Indicator
  const [replyingTo, setReplyingTo] = useState<EnhancedMessage | null>(null); // New: Reply State
  
  const flatListRef = useRef<FlatList>(null);

  // Hide Tab Bar
  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => parent?.setOptions({ tabBarStyle: { height: 56, paddingBottom: 6, paddingTop: 6, display: 'flex' } });
  }, [navigation]);

  // Load Messages
  useEffect(() => {
    let targetMessages: EnhancedMessage[] = [];
    if (chatId) {
       const chat = allChats.find(c => c.id === chatId);
       if (chat) targetMessages = chat.messages.map(m => ({...m, status: 'read'}));
    } else {
       const existingChat = allChats.find(c => c.participants.some(p => p.id === recipient.id));
       if (existingChat) targetMessages = existingChat.messages.map(m => ({...m, status: 'read'}));
    }
    setCurrentMessages(targetMessages);
    setLoading(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
  }, [chatId, recipient.id]);

  // --- ACTIONS ---

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    const newMessage: EnhancedMessage = {
      id: Date.now().toString(),
      conversation_id: chatId || 'temp_id',
      sender_id: currentUser?.id || 'current-user',
      sender_name: currentUser?.name || 'You',
      sender_avatar: currentUser?.avatar || '',
      content: messageText,
      is_read: false,
      created_at: new Date().toISOString(),
      status: 'sent', // Initially sent
      replyTo: replyingTo || undefined
    };

    setCurrentMessages(prev => [...prev, newMessage]);
    setMessageText('');
    setReplyingTo(null);
    
    // Simulate "Delivered" then "Read" status updates
    setTimeout(() => {
        setCurrentMessages(prev => prev.map(m => m.id === newMessage.id ? {...m, status: 'delivered'} : m));
    }, 1000);

    setTimeout(() => {
        setCurrentMessages(prev => prev.map(m => m.id === newMessage.id ? {...m, status: 'read'} : m));
    }, 2500);

    // Simulate Reply from other user
    simulateIncomingMessage();

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
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
            content: "That sounds awesome! Let's do it. 🔥",
            is_read: true,
            created_at: new Date().toISOString(),
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
        { text: "Cancel", style: "cancel" }
    ]);
  };

  const navigateToProfile = () => {
      // @ts-ignore - assuming Profile screen can handle 'user' param
      navigation.navigate('Profile', { user: recipient });
  };

  // --- RENDER HELPERS ---

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const renderDateHeader = (date: string) => (
    <View style={styles.dateHeaderContainer}>
        <Text style={styles.dateHeaderText}>{date}</Text>
    </View>
  );

  const renderMessageItem = ({ item, index }: { item: EnhancedMessage; index: number }) => {
    const isMyMessage = item.sender_id === currentUser?.id;
    const showAvatar = index === currentMessages.length - 1 || currentMessages[index + 1]?.sender_id !== item.sender_id;
    
    // Date Header Logic
    const currentDate = getRelativeDate(item.created_at);
    const prevDate = index > 0 ? getRelativeDate(currentMessages[index - 1].created_at) : null;
    const showDateHeader = currentDate !== prevDate;

    return (
      <View>
        {showDateHeader && renderDateHeader(currentDate)}
        
        <TouchableOpacity 
            activeOpacity={0.8} 
            onLongPress={() => handleLongPress(item)}
            style={[styles.messageRow, isMyMessage ? styles.rowRight : styles.rowLeft]}
        >
          {/* Avatar (Left) */}
          {!isMyMessage && (
             <View style={styles.avatarContainer}>
                 {showAvatar && <Image source={{ uri: item.sender_avatar }} style={styles.avatar} />}
             </View>
          )}

          {/* Bubble */}
          <View style={[
              styles.bubble, 
              isMyMessage ? styles.bubbleRight : styles.bubbleLeft,
              !showAvatar && (isMyMessage ? styles.bubbleRightGroup : styles.bubbleLeftGroup)
          ]}>
             {/* Reply Context */}
             {item.replyTo && (
                 <View style={styles.replyContext}>
                     <View style={styles.replyBar} />
                     <Text style={styles.replyName}>{item.replyTo.sender_id === currentUser?.id ? 'You' : item.replyTo.sender_name}</Text>
                     <Text style={styles.replyText} numberOfLines={1}>{item.replyTo.content}</Text>
                 </View>
             )}

             <Text style={[styles.messageText, isMyMessage ? styles.textLight : styles.textDark]}>
                 {item.content}
             </Text>
             
             <View style={styles.metaContainer}>
                 <Text style={[styles.timeText, isMyMessage ? styles.timeLight : styles.timeDark]}>
                     {formatTime(item.created_at)}
                 </Text>
                 {isMyMessage && (
                     <Ionicons 
                        name={item.status === 'read' ? "checkmark-done" : item.status === 'delivered' ? "checkmark-done" : "checkmark"} 
                        size={14} 
                        color={item.status === 'read' ? '#4ade80' : 'rgba(255,255,255,0.7)'} 
                        style={{ marginLeft: 4 }}
                     />
                 )}
             </View>
          </View>

        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* 1. CLICKABLE HEADER */}
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

        <TouchableOpacity style={styles.headerOption}>
            <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* 2. MESSAGE LIST */}
      <FlatList
        ref={flatListRef}
        data={currentMessages}
        keyExtractor={item => item.id}
        renderItem={renderMessageItem}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
            isTyping ? (
                <View style={{ marginLeft: 50, marginBottom: 10 }}>
                    <Text style={{ color: '#999', fontSize: 12, fontStyle: 'italic' }}>{recipient.name} is typing...</Text>
                </View>
            ) : null
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-ellipses-outline" size={64} color="#ddd" />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySub}>Start the conversation with {recipient.name}!</Text>
            </View>
          )
        }
      />

      {/* 3. INPUT AREA */}
      <View style={styles.inputWrapper}>
        {/* Reply Banner */}
        {replyingTo && (
            <View style={styles.replyBanner}>
                <View style={{flex: 1}}>
                    <Text style={styles.replyBannerTitle}>Replying to {replyingTo.sender_id === currentUser?.id ? 'Yourself' : replyingTo.sender_name}</Text>
                    <Text style={styles.replyBannerText} numberOfLines={1}>{replyingTo.content}</Text>
                </View>
                <TouchableOpacity onPress={() => setReplyingTo(null)}>
                    <Ionicons name="close" size={20} color="#666" />
                </TouchableOpacity>
            </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
            <TouchableOpacity style={styles.attachBtn}>
                <Ionicons name="add" size={24} color={theme.colors.primary} />
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
                <TouchableOpacity style={styles.mediaBtn}>
                    <Ionicons name="camera-outline" size={22} color="#999" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity 
                style={[styles.sendBtn, !messageText.trim() && styles.sendBtnDisabled]} 
                onPress={handleSendMessage}
                disabled={!messageText.trim()}
            >
                {messageText.trim() ? (
                    <Ionicons name="send" size={18} color="#fff" style={{ marginLeft: 2 }} />
                ) : (
                    <Ionicons name="mic-outline" size={22} color="#fff" />
                )}
            </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f4f7' }, // Standard chat background color
  center: { justifyContent: 'center', alignItems: 'center' },
  
  // HEADER
  header: { 
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', 
      height: 60, paddingHorizontal: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 
  },
  backBtn: { padding: 8 },
  headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 5 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eee' },
  onlineBadge: { 
      position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, 
      borderRadius: 5, backgroundColor: '#4ade80', borderWidth: 1.5, borderColor: '#fff' 
  },
  headerTextContainer: { marginLeft: 10 },
  headerName: { fontSize: 16, fontWeight: '700', color: '#111' },
  headerStatus: { fontSize: 11, color: '#4ade80', fontWeight: '500' },
  headerOption: { padding: 8 },

  // LIST
  listContent: { paddingVertical: 15, paddingHorizontal: 12 },
  
  // DATE HEADER
  dateHeaderContainer: { alignItems: 'center', marginVertical: 12 },
  dateHeaderText: { 
      fontSize: 11, fontWeight: '600', color: '#666', backgroundColor: '#e5e7eb', 
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' 
  },

  // MESSAGES
  messageRow: { flexDirection: 'row', marginBottom: 2, alignItems: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  
  avatarContainer: { width: 28, marginRight: 8, paddingBottom: 4 },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  
  bubble: { 
      maxWidth: '75%', paddingHorizontal: 12, paddingVertical: 8, 
      borderRadius: 18, elevation: 1 
  },
  bubbleLeft: { backgroundColor: '#fff', borderBottomLeftRadius: 4 },
  bubbleLeftGroup: { borderBottomLeftRadius: 18, marginBottom: 2 },
  bubbleRight: { backgroundColor: theme.colors.primary, borderBottomRightRadius: 4 },
  bubbleRightGroup: { borderBottomRightRadius: 18, marginBottom: 2 },

  messageText: { fontSize: 15, lineHeight: 21 },
  textLight: { color: '#fff' },
  textDark: { color: '#111' },

  metaContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 2 },
  timeText: { fontSize: 10 },
  timeLight: { color: 'rgba(255,255,255,0.7)' },
  timeDark: { color: '#999' },

  // REPLY
  replyContext: { 
      backgroundColor: 'rgba(0,0,0,0.1)', padding: 6, borderRadius: 8, 
      marginBottom: 6, borderLeftWidth: 3, borderLeftColor: 'rgba(0,0,0,0.3)' 
  },
  replyBar: { position: 'absolute' }, // Styling handled by borderLeft above
  replyName: { fontSize: 11, fontWeight: '700', color: 'rgba(0,0,0,0.6)', marginBottom: 2 },
  replyText: { fontSize: 12, color: 'rgba(0,0,0,0.5)' },

  // INPUT
  inputWrapper: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  replyBanner: { 
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', 
      padding: 8, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#ddd' 
  },
  replyBannerTitle: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
  replyBannerText: { fontSize: 12, color: '#666' },

  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 8 },
  attachBtn: { padding: 10, justifyContent: 'center', alignItems: 'center' },
  inputFieldContainer: { 
      flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f2f4f7', 
      borderRadius: 20, marginHorizontal: 5, paddingHorizontal: 12, minHeight: 40 
  },
  input: { flex: 1, maxHeight: 100, fontSize: 15, paddingVertical: 8, color: '#000' },
  mediaBtn: { padding: 5 },
  sendBtn: { 
      width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary, 
      justifyContent: 'center', alignItems: 'center', marginLeft: 4 
  },
  sendBtnDisabled: { backgroundColor: '#b0bec5' },

  // EMPTY
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#888', marginTop: 10 },
  emptySub: { fontSize: 14, color: '#aaa' }
});