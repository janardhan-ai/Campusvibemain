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
  Linking // Required to open documents
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../data/messages';
import * as ImagePicker from 'expo-image-picker'; 
import * as DocumentPicker from 'expo-document-picker'; 
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
  type?: 'text' | 'image' | 'video' | 'voice' | 'deleted' | 'document'; 
  mediaUrl?: string; 
  duration?: string; 
  replyTo?: EnhancedMessage;
  is_edited?: boolean; 
  reactions?: Reaction[];
  fileName?: string; 
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
const uploadToStorage = async (localUri: string, type: 'image' | 'video' | 'voice' | 'document') => {
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
  const [editingMessage, setEditingMessage] = useState<EnhancedMessage | null>(null);

  // Modals & Menus
  const [fullScreenMedia, setFullScreenMedia] = useState<{ url: string, type: 'image' | 'video' } | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<EnhancedMessage | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, alignRight: false });
  const [attachmentMenuVisible, setAttachmentMenuVisible] = useState(false);

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
    const setupAudio = async () => {
      try { await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true }); } 
      catch (e) { console.log(e); }
    };
    setupAudio();

    const parent = navigation.getParent();
    if (parent) parent.setOptions({ tabBarStyle: { display: 'none' } });
    return () => { 
        if (parent) parent.setOptions({ tabBarStyle: { height: 56, paddingBottom: 6, paddingTop: 6, display: 'flex' } });
        if (sound) sound.unloadAsync();
    };
  }, []);

  useEffect(() => {
    const targetMessages: EnhancedMessage[] = []; 
    setCurrentMessages(targetMessages);
    setLoading(false);
  }, [chatId]);

  // --- LINK PARSING ---
  const renderTextWithLinks = (text: string, isMyMessage: boolean) => {
    const parts = text.split(/(https?:\/\/[^\s]+)/g);
    return (
        <Text style={[styles.messageText, isMyMessage ? styles.textDark : styles.textDark]}>
            {parts.map((part, index) => {
                if (part.match(/https?:\/\/[^\s]+/g)) {
                    return <Text key={index} style={{ color: '#007AFF', textDecorationLine: 'underline' }} onPress={() => Linking.openURL(part)}>{part}</Text>;
                }
                return <Text key={index}>{part}</Text>;
            })}
        </Text>
    );
  };

  // --- MENU LOGIC ---
  const handleLongPress = (event: GestureResponderEvent, message: EnhancedMessage) => {
    if (message.type === 'deleted') return;
    Vibration.vibrate(50);
    const { pageY } = event.nativeEvent;
    const isMyMessage = message.sender_id === currentUser?.id;
    const showAbove = pageY > height - 250; 
    setMenuPosition({ top: showAbove ? pageY - 180 : pageY + 10, left: isMyMessage ? width - 200 : 20, alignRight: isMyMessage });
    setSelectedMessage(message);
    setMenuVisible(true);
  };

  const handleReaction = (emoji: string) => {
      if (!selectedMessage) return;
      setCurrentMessages(prev => prev.map(m => m.id === selectedMessage.id ? { ...m, reactions: [...(m.reactions || []), { emoji, count: 1 }] } : m));
      setMenuVisible(false); setSelectedMessage(null);
  };

  const handleMenuAction = (action: 'reply' | 'copy' | 'edit' | 'delete') => {
      if (!selectedMessage) return;
      if (action === 'reply') setReplyingTo(selectedMessage);
      else if (action === 'copy') { if (selectedMessage.type === 'text') Clipboard.setStringAsync(selectedMessage.content); }
      else if (action === 'edit') { setEditingMessage(selectedMessage); setMessageText(selectedMessage.content); }
      else if (action === 'delete') {
          const isMyMessage = selectedMessage.sender_id === currentUser?.id;
          Alert.alert("Delete?", isMyMessage ? "Option" : "Remove for me", [{ text: "Me", onPress: () => setCurrentMessages(p => p.filter(m => m.id !== selectedMessage.id)) }, isMyMessage ? { text: "Everyone", onPress: () => setCurrentMessages(p => p.map(m => m.id === selectedMessage.id ? { ...m, type: 'deleted', content: "🚫 Deleted" } : m)), style: 'destructive' } : {text:'', style:'cancel'}, { text: "Cancel", style: "cancel" }].filter(o=>o.text!=='') as any);
      }
      setMenuVisible(false); setSelectedMessage(null);
  };

  // --- SEND LOGIC ---
  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    if (editingMessage) {
        setCurrentMessages(prev => prev.map(m => m.id === editingMessage.id ? { ...m, content: messageText, is_edited: true } : m));
        setEditingMessage(null); setMessageText(''); return;
    }
    sendGenericMessage('text', messageText);
    simulateIncomingMessage();
  };

  const sendGenericMessage = async (type: 'text' | 'image' | 'video' | 'voice' | 'document', content: string, extraData: any = {}) => {
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
    setAttachmentMenuVisible(false); 
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
        let finalMediaUrl = extraData.mediaUrl;
        if (type !== 'text' && extraData.mediaUrl) finalMediaUrl = await uploadToStorage(extraData.mediaUrl, type);
        await new Promise(resolve => setTimeout(resolve, 500)); 
        setCurrentMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'delivered', mediaUrl: finalMediaUrl } : m));
        setTimeout(() => setCurrentMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'read' } : m)), 3000);
    } catch (error) { console.error("Send failed"); }
  };

  // --- DOCUMENT HANDLER (UPDATED) ---
  const openDocument = async () => {
      try {
          const result = await DocumentPicker.getDocumentAsync({
              type: [
                  'application/pdf',
                  'application/msword',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
                  'application/vnd.ms-excel',
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',    // xlsx
                  'application/vnd.ms-powerpoint',
                  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
                  'text/plain',
                  'image/*',  // JPG, PNG
                  'audio/*',  // MP3, WAV
                  'video/mp4' // MP4
              ],
              copyToCacheDirectory: true
          });

          if (!result.canceled) {
              const file = result.assets[0];
              // Allowed Extensions List
              const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'jpg', 'jpeg', 'png', 'mp3', 'wav', 'm4a', 'aac', 'mp4'];
              const extension = file.name.split('.').pop()?.toLowerCase();

              if (extension && allowedExtensions.includes(extension)) {
                  sendGenericMessage('document', file.name, { mediaUrl: file.uri, fileName: file.name });
              } else {
                  Alert.alert("Unsupported File", "This file type is not supported.");
              }
          }
      } catch (e) {
          Alert.alert("Error", "Could not pick document");
      }
  };

  // --- MEDIA HANDLERS ---
  const openGallery = async () => { 
    try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 1 });
        if (!result.canceled) {
            const asset = result.assets[0];
            const type = asset.type === 'video' ? 'video' : 'image';
            sendGenericMessage(type, type === 'video' ? 'Video' : 'Photo', { mediaUrl: asset.uri });
        }
    } catch (e) {}
  };

  const openCamera = async () => { 
    try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return;
        const result = await ImagePicker.launchCameraAsync({ quality: 1 });
        if (!result.canceled) sendGenericMessage('image', 'Photo', { mediaUrl: result.assets[0].uri });
    } catch (e) {}
  };
  
  // --- RECORDING & AUDIO ---
  const startRecording = async () => {
      try {
          const perm = await Audio.requestPermissionsAsync();
          if (perm.status !== "granted") return;
          await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
          Vibration.vibrate(50);
          setIsRecording(true);
          setRecordingDuration(0);
          timerRef.current = setInterval(() => { setRecordingDuration(prev => prev + 1); }, 1000);
          Animated.loop(Animated.sequence([
              Animated.timing(recordingAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
              Animated.timing(recordingAnim, { toValue: 0, duration: 500, useNativeDriver: true })
          ])).start();
          const { recording: newRecording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
          setRecording(newRecording);
      } catch (err) { console.error('Failed to start recording', err); }
  };

  const stopRecording = async () => {
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      recordingAnim.stopAnimation();
      if (!recording) return;
      try {
          await recording.stopAndUnloadAsync();
          const uri = recording.getURI(); 
          await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
          setRecording(null);
          if (recordingDuration >= 1 && uri) {
              const min = Math.floor(recordingDuration / 60);
              const sec = recordingDuration % 60;
              const durationStr = `${min}:${sec < 10 ? '0' : ''}${sec}`;
              sendGenericMessage('voice', 'Voice Message', { mediaUrl: uri, duration: durationStr });
          }
      } catch (error) { console.log("Error stopping recording", error); }
  };

  const handlePlayAudio = async (id: string, uri: string) => { /* ... (Same as before) ... */ };
  const simulateIncomingMessage = () => { /* ... (Same as before) ... */ };

  // --- RENDERERS ---
  const renderMessageContent = (item: EnhancedMessage, isMyMessage: boolean) => {
      if (item.type === 'deleted') return <Text style={{fontStyle:'italic', color:'#888'}}>{item.content}</Text>;
      
      // DOCUMENT RENDERER (UPDATED)
      if (item.type === 'document') {
          let iconName: any = "document-text";
          let iconColor = theme.colors.primary;
          const ext = item.fileName?.split('.').pop()?.toLowerCase();

          if (ext === 'pdf') { iconName = "document-text"; iconColor = "#E53935"; } // Red for PDF
          else if (['doc', 'docx'].includes(ext || '')) { iconName = "document"; iconColor = "#1E88E5"; } // Blue for Word
          else if (['xls', 'xlsx', 'csv'].includes(ext || '')) { iconName = "stats-chart"; iconColor = "#43A047"; } // Green for Excel
          else if (['jpg', 'jpeg', 'png'].includes(ext || '')) { iconName = "image"; iconColor = "#8E24AA"; } // Purple for Images
          else if (['mp3', 'wav', 'm4a', 'aac'].includes(ext || '')) { iconName = "musical-notes"; iconColor = "#FB8C00"; } // Orange for Audio
          else if (['mp4'].includes(ext || '')) { iconName = "videocam"; iconColor = "#E53935"; } // Red for Video

          return (
              <TouchableOpacity onPress={() => Linking.openURL(item.mediaUrl!)} style={styles.documentContainer}>
                  <View style={[styles.docIcon, { backgroundColor: iconColor + '20' }]}>
                      <Ionicons name={iconName} size={24} color={iconColor} />
                  </View>
                  <Text style={styles.docText} numberOfLines={1}>{item.fileName || "Document"}</Text>
              </TouchableOpacity>
          );
      }

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
                  <TouchableOpacity onPress={() => handlePlayAudio(item.id, item.mediaUrl!)}>
                      <Ionicons name={playingAudioId === item.id ? "pause-circle" : "play-circle"} size={36} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <View style={styles.voiceWaveform}>
                      <View style={[styles.voiceTrack, { backgroundColor: isMyMessage ? '#CFD8DC' : '#ddd' }]}>
                          <Animated.View style={[styles.voiceProgress, { width: playingAudioId === item.id ? '50%' : '0%', backgroundColor: theme.colors.primary } ]} />
                      </View>
                      <Text style={{color: '#666', fontSize: 11}}>{item.duration}</Text>
                  </View>
              </View>
          );
      }

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
             
             {item.type !== 'deleted' && (
                 <View style={styles.metaContainer}>
                     <Text style={[styles.timeText, styles.textDark]}>
                         {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         {item.is_edited && " • Edited"}
                     </Text>
                     {isMyMessage && <Ionicons name={item.status === 'read' ? "checkmark-done" : "checkmark"} size={14} color={item.status === 'read' ? theme.colors.primary : '#999'} style={{ marginLeft: 4 }} />}
                 </View>
             )}
             
             {item.reactions && item.reactions.length > 0 && (
                 <View style={styles.reactionsContainer}>
                     {item.reactions.map((r, i) => <Text key={i} style={{fontSize: 12}}>{r.emoji}</Text>)}
                 </View>
             )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
            {(replyingTo || editingMessage) && (
                <View style={styles.replyBanner}>
                    <View style={{flex: 1}}>
                        <Text style={styles.replyBannerTitle}>{editingMessage ? "Editing Message" : `Replying to ${replyingTo?.sender_name}`}</Text>
                        <Text style={styles.replyBannerText} numberOfLines={1}>{editingMessage ? editingMessage.content : replyingTo?.content}</Text>
                    </View>
                    <TouchableOpacity onPress={() => { setReplyingTo(null); setEditingMessage(null); setMessageText(''); }}><Ionicons name="close" size={20} color="#666" /></TouchableOpacity>
                </View>
            )}

            <View style={styles.inputBar}>
                {/* ATTACH BUTTON */}
                <TouchableOpacity style={styles.attachBtn} onPress={() => setAttachmentMenuVisible(true)}>
                    <Ionicons name="add" size={28} color={theme.colors.primary} />
                </TouchableOpacity>

                <TextInput style={styles.input} placeholder="Message..." value={messageText} onChangeText={setMessageText} multiline />
                <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}>
                    {editingMessage ? <Ionicons name="checkmark" size={20} color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
                </TouchableOpacity>
            </View>
        </View>
      </KeyboardAvoidingView>

      {/* --- ATTACHMENT POPUP MENU --- */}
      <Modal visible={attachmentMenuVisible} transparent animationType="fade" onRequestClose={() => setAttachmentMenuVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setAttachmentMenuVisible(false)}>
            <View style={styles.menuOverlay}>
                <View style={styles.attachmentMenu}>
                    <TouchableOpacity style={styles.attachmentItem} onPress={() => { openGallery(); setAttachmentMenuVisible(false); }}>
                        <View style={[styles.iconCircle, {backgroundColor: '#E3F2FD'}]}><Ionicons name="images" size={20} color="#0288D1" /></View>
                        <Text style={styles.attachmentText}>Gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.attachmentItem} onPress={() => { openCamera(); setAttachmentMenuVisible(false); }}>
                        <View style={[styles.iconCircle, {backgroundColor: '#E8F5E9'}]}><Ionicons name="camera" size={20} color="#388E3C" /></View>
                        <Text style={styles.attachmentText}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.attachmentItem} onPress={() => { openDocument(); setAttachmentMenuVisible(false); }}>
                        <View style={[styles.iconCircle, {backgroundColor: '#FFF3E0'}]}><Ionicons name="document-text" size={20} color="#FB8C00" /></View>
                        <Text style={styles.attachmentText}>Document</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* --- MESSAGE CONTEXT MENU --- */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
            <View style={styles.menuOverlay}>
                <View style={[styles.popupMenu, { top: menuPosition.top, left: menuPosition.alignRight ? undefined : 20, right: menuPosition.alignRight ? 20 : undefined }]}>
                    <View style={styles.reactionRow}>
                        {['❤️', '😂', '👍', '🔥', '😢'].map(emoji => (
                            <TouchableOpacity key={emoji} onPress={() => handleReaction(emoji)} style={{padding: 5}}><Text style={{fontSize: 22}}>{emoji}</Text></TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.popupItem} onPress={() => handleMenuAction('reply')}><Text style={styles.popupText}>Reply</Text><Ionicons name="arrow-undo-outline" size={18} color="#333" /></TouchableOpacity>
                    {selectedMessage?.type === 'text' && <TouchableOpacity style={styles.popupItem} onPress={() => handleMenuAction('copy')}><Text style={styles.popupText}>Copy</Text><Ionicons name="copy-outline" size={18} color="#333" /></TouchableOpacity>}
                    {selectedMessage?.sender_id === currentUser?.id && selectedMessage.type === 'text' && <TouchableOpacity style={styles.popupItem} onPress={() => handleMenuAction('edit')}><Text style={styles.popupText}>Edit</Text><Ionicons name="pencil-outline" size={18} color="#333" /></TouchableOpacity>}
                    <TouchableOpacity style={[styles.popupItem, { borderBottomWidth: 0 }]} onPress={() => handleMenuAction('delete')}><Text style={[styles.popupText, { color: '#FF3B30' }]}>Delete</Text><Ionicons name="trash-outline" size={18} color="#FF3B30" /></TouchableOpacity>
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
  attachBtn: { padding: 10, justifyContent: 'center', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#f2f4f7', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, maxHeight: 100, marginRight: 8, color: '#000' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#888', marginTop: 10 },
  dateHeaderContainer: { alignItems: 'center', marginVertical: 12 },
  dateHeaderText: { fontSize: 11, fontWeight: '600', color: '#666', backgroundColor: '#e5e7eb', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  fullScreenContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  fullScreenImage: { width: width, height: height * 0.8 },
  fullScreenClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' },
  popupMenu: { position: 'absolute', width: 180, backgroundColor: 'white', borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5, paddingVertical: 5 },
  reactionRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 8 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 2 },
  popupItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  popupText: { fontSize: 16, color: '#333', fontWeight: '500' },
  reactionsContainer: { flexDirection: 'row', position: 'absolute', bottom: -10, left: 10, backgroundColor: '#fff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: '#eee', elevation: 1 },
  attachmentMenu: { position: 'absolute', bottom: 80, left: 20, backgroundColor: 'white', borderRadius: 16, padding: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5, minWidth: 150 },
  attachmentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10 },
  attachmentText: { fontSize: 16, fontWeight: '500', marginLeft: 15, color: '#333' },
  iconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  documentContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#F5F5F5', borderRadius: 10, minWidth: 150 },
  docIcon: { marginRight: 10, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  docText: { flex: 1, fontSize: 14, fontWeight: '500', color: '#333' }
});