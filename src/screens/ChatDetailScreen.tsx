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
  ActivityIndicator
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../data/messages';

type Props = NativeStackScreenProps<HomeStackParamList, 'ChatDetail'>;

export const ChatDetailScreen = ({ route, navigation }: Props) => {
  const params = route.params as any; 
  const { currentUser, messages } = useApp();
  const allChats = messages || []; 
  
  let recipient = params.recipient;

  if (!recipient && params.userId) {
     recipient = {
        id: params.userId,
        name: params.userName,
        avatar: params.userAvatar,
        username: 'User', 
     };
  }

  if (!recipient && params.chatId) {
     const chat = allChats.find(c => c.id === params.chatId);
     if (chat) {
        recipient = chat.participants.find(p => p.id !== currentUser?.id);
     }
  }
  
  if (!recipient) {
      return (
        <View style={[styles.container, styles.center]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
  }

  const chatId = params.chatId;

  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

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
    let targetMessages: Message[] = [];

    if (chatId) {
       const chat = allChats.find(c => c.id === chatId);
       if (chat) targetMessages = chat.messages;
    } else {
       const existingChat = allChats.find(c => 
          c.participants.some(p => p.id === recipient.id)
       );
       if (existingChat) targetMessages = existingChat.messages;
    }

    setCurrentMessages(targetMessages);
    setLoading(false);
    
    setTimeout(() => {
        if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: false });
        }
    }, 100);
    
  }, [chatId, recipient.id]); 

  const sendMessage = () => {
    if (!messageText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      conversation_id: chatId || 'temp_id',
      sender_id: currentUser?.id || 'current-user',
      sender_name: currentUser?.name || 'You',
      sender_avatar: currentUser?.avatar || 'https://i.pravatar.cc/150?img=11',
      content: messageText,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setCurrentMessages(prev => [...prev, newMessage]);
    setMessageText('');
    
    setTimeout(() => {
       flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const shouldShowAvatar = (index: number) => {
    // Show avatar only on the LAST message of a sequence from the same user
    if (index === currentMessages.length - 1) return true;
    const currentMsg = currentMessages[index];
    const nextMsg = currentMessages[index + 1];
    return currentMsg.sender_id !== nextMsg?.sender_id;
  };

  const shouldShowTime = (index: number) => {
    if (index === 0) return true;
    const currentMsg = currentMessages[index];
    const prevMsg = currentMessages[index - 1];
    const timeDiff = new Date(currentMsg.created_at).getTime() - new Date(prevMsg.created_at).getTime();
    return timeDiff > 5 * 60 * 1000;
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.sender_id === currentUser?.id;
    const showAvatar = shouldShowAvatar(index);
    const showTime = shouldShowTime(index);

    return (
      <View>
        {showTime && (
          <View style={styles.timeStampContainer}>
            <Text style={styles.timeStampText}>{formatTime(item.created_at)}</Text>
          </View>
        )}
        <View style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer]}>
          
          {/* LEFT SIDE (Their Avatar) */}
          {!isMyMessage && (
            <View style={styles.avatarPlaceholder}>
              {showAvatar && (
                <Image source={{ uri: item.sender_avatar }} style={styles.messageAvatar} />
              )}
            </View>
          )}

          {/* MESSAGE BUBBLE */}
          <View style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
            !showAvatar && isMyMessage && styles.myMessageBubbleGroup,
            !showAvatar && !isMyMessage && styles.theirMessageBubbleGroup,
          ]}>
            <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
              {item.content}
            </Text>
          </View>

          {/* RIGHT SIDE (My Avatar - NEW ADDITION) */}
          {isMyMessage && (
            <View style={styles.avatarPlaceholder}>
               {showAvatar && (
                 <Image source={{ uri: item.sender_avatar }} style={styles.messageAvatar} />
               )}
            </View>
          )}

        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerAvatarContainer}>
          <Image source={{ uri: recipient.avatar }} style={styles.headerAvatar} />
          <View style={styles.headerOnlineIndicator} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{recipient.name}</Text>
          <Text style={styles.onlineStatus}>Active now</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={currentMessages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-ellipses-outline" size={64} color={theme.colors.textLight} />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Say hi to {recipient.name}!</Text>
            </View>
          )
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!messageText.trim()}
        >
          <Ionicons name="send" size={20} color={theme.colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl + 10,
    paddingBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.xs,
  },
  headerAvatarContainer: {
    position: 'relative',
    marginRight: theme.spacing.sm,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  headerOnlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  onlineStatus: {
    fontSize: theme.fontSize.xs,
    color: '#10B981',
    fontWeight: theme.fontWeight.medium,
    marginTop: 2,
  },
  messagesList: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
  timeStampContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  timeStampText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textLight,
    backgroundColor: theme.colors.backgroundLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    fontWeight: theme.fontWeight.medium,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
    alignItems: 'flex-end',
    paddingHorizontal: 0,
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  theirMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    marginLeft: theme.spacing.xs,
    marginRight: theme.spacing.sm,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  messageBubble: {
    maxWidth: '65%',
    paddingHorizontal: theme.spacing.sm + 4,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.sm,
  },
  myMessageBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 6,
  },
  theirMessageBubble: {
    backgroundColor: theme.colors.white,
    borderBottomLeftRadius: 6,
  },
  myMessageBubbleGroup: {
    borderBottomRightRadius: theme.borderRadius.xl,
    marginBottom: 2,
  },
  theirMessageBubbleGroup: {
    borderBottomLeftRadius: theme.borderRadius.xl,
    marginBottom: 2,
  },
  messageText: {
    fontSize: theme.fontSize.sm + 1,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  myMessageText: {
    color: theme.colors.white,
  },
  theirMessageText: {
    color: theme.colors.text,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl * 2,
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
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: theme.colors.white,
    flexDirection: 'row',
    padding: theme.spacing.md,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.md + 2,
    paddingVertical: theme.spacing.sm + 2,
    fontSize: theme.fontSize.md,
    maxHeight: 100,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
  },
});