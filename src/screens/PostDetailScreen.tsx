import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Share, 
  Modal, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  Alert,
  FlatList
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';

// --- IMPORT SMART ASPECT RATIO HELPER ---
import { getSmartAspectRatio } from './utils/aspectRatio'; 

type Props = NativeStackScreenProps<HomeStackParamList, 'PostDetail'>;

// --- MOCK POSTS ---
const MOCK_POSTS = [
  {
    id: 'm1',
    user: { username: 'jana7993', avatar: 'https://i.pravatar.cc/150?u=jana', college: 'CMRTC' },
    image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=1000&auto=format&fit=crop',
    width: 1080, height: 1350, // Portrait
    caption: 'Won the 1st prize at the National Hackathon 2025! 🏆💻',
    description: 'It was an intense 24-hour coding sprint...',
    hashtags: ['#coding', '#hackathon', '#winner', '#cmrtc'],
    likes: 124, comments: 45, shares: 12, isLiked: true
  },
];

// --- COMMENTS DATA (Nested Structure) ---
const dummyComments = [
  { 
    id: '1', 
    user: 'rahul_memes', 
    avatar: 'https://i.pravatar.cc/150?img=13', 
    text: 'This is amazing! Congrats guys 🔥', 
    likes: 12, isLiked: false, timestamp: '2h',
    replies: [
        { id: '1a', user: 'jana7993', avatar: 'https://i.pravatar.cc/150?u=jana', text: 'Thanks bro! It was tough but worth it.', likes: 4, isLiked: true, timestamp: '1h' },
        { id: '1b', user: 'vijju_rowdy_', avatar: 'https://i.pravatar.cc/150?img=5', text: '@jana7993 Party when? 🥳', likes: 2, isLiked: false, timestamp: '30m' }
    ]
  },
  { 
    id: '2', user: 'sara_codes', avatar: 'https://i.pravatar.cc/150?img=9', text: 'Love the UI design, very clean.', likes: 8, isLiked: false, timestamp: '3h', replies: [] 
  },
];

const ALL_USERS_DB = [
  { id: 'u1', name: 'Rahul', username: 'rahul_01', avatar: 'https://i.pravatar.cc/150?img=12', accountType: 'follower', shareCount: 150 }, 
  { id: 'u2', name: 'Priya', username: 'priya_x', avatar: 'https://i.pravatar.cc/150?img=5', accountType: 'public', shareCount: 85 },   
  { id: 'u5', name: 'Kiran', username: 'kiran_tech', avatar: 'https://i.pravatar.cc/150?img=11', accountType: 'public', shareCount: 40 },  
  { id: 'u3', name: 'Arjun', username: 'arjun_dev', avatar: 'https://i.pravatar.cc/150?img=3', accountType: 'follower', shareCount: 12 },  
  { id: 'u4', name: 'Neha', username: 'neha_design', avatar: 'https://i.pravatar.cc/150?img=9', accountType: 'private', shareCount: 0 },   
];

export const PostDetailScreen = ({ navigation, route }: Props) => {
  const { postId } = route.params;
  const { posts, likePost, currentUser } = useApp(); 

  const postData = posts.find(p => p.id === postId) || MOCK_POSTS.find(p => p.id === postId);

  // --- SMART ASPECT RATIO LOGIC ---
  // @ts-ignore
  const imageAspectRatio = getSmartAspectRatio(postData?.width, postData?.height);

  const [isLiked, setIsLiked] = useState(postData?.isLiked || false);
  const [likesCount, setLikesCount] = useState(postData?.likes || 0);

  const [commentsVisible, setCommentsVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [newComment, setNewComment] = useState('');
  const [commentsList, setCommentsList] = useState(dummyComments);
  const [isFollowing, setIsFollowing] = useState(false);

  // --- REPLY STATE ---
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyingToUser, setReplyingToUser] = useState<string | null>(null);
  
  const inputRef = useRef<TextInput>(null);
  const isOwner = currentUser?.username === postData?.user.username;

  const shareableUsers = ALL_USERS_DB.filter(user => 
    (user.accountType === 'follower' || user.accountType === 'public') && 
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => b.shareCount - a.shareCount);

  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => parent?.setOptions({ tabBarStyle: { height: 56, paddingBottom: 6, paddingTop: 6, display: 'flex' } });
  }, [navigation]);

  const handleLikeToggle = () => {
    const newState = !isLiked;
    setIsLiked(newState);
    setLikesCount(prev => newState ? prev + 1 : prev - 1);
    if(postData) likePost(postData.id);
  };

  const handleFollowToggle = () => setIsFollowing(!isFollowing);

  const handleExternalShare = async () => {
    try { await Share.share({ message: `Check out this post!`, url: postData?.image }); } catch (error: any) {}
  };

  const handleCopyLink = () => { Alert.alert("Link Copied"); setShareModalVisible(false); };
  const handleSendShare = (u: string) => { Alert.alert("Sent", `Shared with @${u}`); setShareModalVisible(false); };

  // --- INSTAGRAM STYLE REPLY LOGIC ---
  const handlePostComment = () => {
    if (newComment.trim().length === 0) return;

    const newCommentObj = {
      id: Date.now().toString(),
      user: currentUser?.username || 'You',
      avatar: currentUser?.avatar || 'https://i.pravatar.cc/150?img=60',
      text: newComment,
      likes: 0, isLiked: false, timestamp: 'Just now', replies: []
    };

    if (replyingToId) {
      const updatedList = commentsList.map(comment => {
        // 1. Reply to Parent directly
        if (comment.id === replyingToId) {
          return { ...comment, replies: [...(comment.replies || []), newCommentObj] };
        }
        // 2. Reply to a Child (Flattening Logic)
        // If we are replying to a comment that is ALREADY a reply, 
        // we add the new comment to the MAIN PARENT's list, not nested deeper.
        if (comment.replies && comment.replies.some((r: any) => r.id === replyingToId)) {
           return { ...comment, replies: [...comment.replies, newCommentObj] };
        }
        return comment;
      });
      setCommentsList(updatedList);
      setReplyingToId(null); setReplyingToUser(null);
    } else {
      setCommentsList([newCommentObj, ...commentsList]);
    }
    setNewComment('');
  };

  const handleReplyTo = (commentId: string, username: string) => {
    setReplyingToId(commentId);
    setReplyingToUser(username);
    setNewComment(`@${username} `);
    inputRef.current?.focus();
  };

  const handleLikeComment = (id: string) => {
    const toggle = (list: any[]) => list.map(c => {
      if (c.id === id) return { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 };
      if (c.replies) return { ...c, replies: toggle(c.replies) };
      return c;
    });
    setCommentsList(toggle(commentsList));
  };

  // --- RENDER COMMENT ITEM ---
  const renderCommentItem = (comment: any, isReply = false) => (
    <View key={comment.id} style={[styles.commentContainer, isReply && styles.replyContainer]}>
      <View style={styles.commentRow}>
        <Image source={{ uri: comment.avatar }} style={styles.commentAvatar} />
        <View style={styles.commentContent}>
          <Text style={styles.commentUser}>{comment.user} <Text style={styles.commentTime}>{comment.timestamp}</Text></Text>
          <Text style={styles.commentText}>{comment.text}</Text>
          <View style={styles.commentActions}>
            <TouchableOpacity onPress={() => handleLikeComment(comment.id)} style={styles.actionBtn}>
               <Text style={[styles.actionBtnText, comment.isLiked && {color: theme.colors.error}]}>Like</Text>
               {comment.likes > 0 && <Text style={styles.likesCountText}>{comment.likes}</Text>}
            </TouchableOpacity>
            {/* Pass current ID so logic knows who we are replying to */}
            <TouchableOpacity onPress={() => handleReplyTo(comment.id, comment.user)} style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity onPress={() => handleLikeComment(comment.id)} style={{ padding: 4 }}>
           <Ionicons name={comment.isLiked ? "heart" : "heart-outline"} size={14} color={comment.isLiked ? theme.colors.error : '#999'} />
        </TouchableOpacity>
      </View>
      {/* Recursively render replies */}
      {comment.replies && comment.replies.map((r: any) => renderCommentItem(r, true))}
    </View>
  );

  if (!postData) return null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.white }}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.userHeader}>
          <Image source={{ uri: postData.user.avatar }} style={styles.avatar} />
          <View style={styles.userInfo}>
            <Text style={styles.username}>{postData.user.username}</Text>
            <Text style={styles.college}>{postData.user.college}</Text>
          </View>
          {!isOwner && (
            <TouchableOpacity style={[styles.followBtn, isFollowing ? styles.followingBtn : styles.notFollowingBtn]} onPress={handleFollowToggle}>
              <Text style={[styles.followText, isFollowing ? styles.followingText : styles.notFollowingText]}>{isFollowing ? 'Following' : 'Follow'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* --- SMART RATIO IMAGE --- */}
        <Image source={{ uri: postData.image }} style={[styles.postImage, { aspectRatio: imageAspectRatio }]} />

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLikeToggle}>
            <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={28} color={isLiked ? theme.colors.error : theme.colors.text} />
            <Text style={styles.actionText}>{likesCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setCommentsVisible(true)}>
            <Ionicons name="chatbubble-outline" size={26} color={theme.colors.text} />
            <Text style={styles.actionText}>{postData.comments}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setShareModalVisible(true)}>
            <Ionicons name="paper-plane-outline" size={26} color={theme.colors.text} />
            <Text style={styles.actionText}>{postData.shares}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.caption}>
          <Text style={styles.captionText}><Text style={styles.captionUsername}>{postData.user.username}</Text> {postData.caption}</Text>
          {postData.description && <Text style={styles.description}>{postData.description}</Text>}
          <Text style={styles.hashtags}>{postData.hashtags.join(' ')}</Text>
        </View>

        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments</Text>
          {commentsList.slice(0, 3).map(c => renderCommentItem(c))}
          {commentsList.length > 3 && (
            <TouchableOpacity onPress={() => setCommentsVisible(true)}>
              <Text style={{ color: theme.colors.textMuted, marginTop: 12 }}>View all {commentsList.length} comments</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* --- COMMENTS MODAL --- */}
      <Modal animationType="slide" transparent={true} visible={commentsVisible} onRequestClose={() => setCommentsVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentsVisible(false)}><Ionicons name="close" size={24} color="#000" /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {commentsList.map(c => renderCommentItem(c))}
            </ScrollView>
            <View style={styles.inputContainer}>
              {replyingToUser && (
                <View style={styles.replyingToBar}>
                  <Text style={{fontSize: 12, color: '#666'}}>Replying to {replyingToUser}</Text>
                  <TouchableOpacity onPress={() => { setReplyingToId(null); setReplyingToUser(null); }}><Ionicons name="close-circle" size={16} color="#666" /></TouchableOpacity>
                </View>
              )}
              <View style={{flexDirection: 'row', alignItems: 'center', width: '100%'}}>
                <TextInput ref={inputRef} style={styles.input} placeholder={replyingToUser ? "Write a reply..." : "Add a comment..."} value={newComment} onChangeText={setNewComment} />
                <TouchableOpacity onPress={handlePostComment} disabled={!newComment.trim()}>
                  <Text style={[styles.postButtonText, { color: newComment.trim() ? theme.colors.primary : theme.colors.textMuted }]}>Post</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- SHARE MODAL --- */}
      <Modal animationType="slide" transparent={true} visible={shareModalVisible} onRequestClose={() => setShareModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '65%' }]}> 
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share to...</Text>
              <TouchableOpacity onPress={() => setShareModalVisible(false)}><Ionicons name="close" size={24} color="#000" /></TouchableOpacity>
            </View>
            <View style={styles.externalShareContainer}>
              <TouchableOpacity style={styles.externalShareItem} onPress={handleExternalShare}><View style={[styles.iconCircle, { backgroundColor: theme.colors.primary }]}><Ionicons name="share-social" size={24} color="#fff" /></View><Text style={styles.externalShareText}>Share via...</Text></TouchableOpacity>
              <TouchableOpacity style={styles.externalShareItem} onPress={handleCopyLink}><View style={[styles.iconCircle, { backgroundColor: '#f0f0f0' }]}><Ionicons name="link" size={24} color="#333" /></View><Text style={styles.externalShareText}>Copy Link</Text></TouchableOpacity>
            </View>
            <View style={styles.divider} />
            <Text style={styles.sectionHeader}>Send to friends</Text>
            <View style={styles.searchContainer}><Ionicons name="search" size={20} color="#666" style={{marginRight: 8}} /><TextInput placeholder="Search followers..." value={searchQuery} onChangeText={setSearchQuery} style={styles.searchInput} /></View>
            <FlatList data={shareableUsers} keyExtractor={item => item.id} contentContainerStyle={{ paddingHorizontal: 20 }} renderItem={({ item }) => (
                <View style={styles.shareRow}>
                  <View style={{flexDirection:'row', alignItems:'center', gap:12}}><Image source={{ uri: item.avatar }} style={styles.commentAvatar} /><Text style={{fontWeight:'600'}}>{item.name}</Text></View>
                  <TouchableOpacity style={styles.sendButton} onPress={() => handleSendShare(item.username)}><Text style={styles.sendButtonText}>Send</Text></TouchableOpacity>
                </View>
            )} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.xl + 10, paddingBottom: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backButton: { padding: theme.spacing.xs },
  headerTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold, color: theme.colors.text },
  userHeader: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  userInfo: { flex: 1, marginLeft: theme.spacing.sm },
  username: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.text },
  college: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted, marginTop: 2 },
  followBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  notFollowingBtn: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  followingBtn: { backgroundColor: 'transparent', borderColor: '#ccc' },
  followText: { fontSize: 14, fontWeight: '600' },
  notFollowingText: { color: '#fff' },
  followingText: { color: '#000' },
  postImage: { width: '100%', resizeMode: 'cover', backgroundColor: theme.colors.backgroundLight },
  actions: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.md, gap: theme.spacing.md },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  actionText: { fontSize: theme.fontSize.md, color: theme.colors.text, fontWeight: theme.fontWeight.medium },
  caption: { paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.md },
  captionText: { fontSize: theme.fontSize.md, color: theme.colors.text, lineHeight: 20 },
  captionUsername: { fontWeight: theme.fontWeight.semibold },
  description: { fontSize: theme.fontSize.md, color: theme.colors.textLight, marginTop: theme.spacing.sm, lineHeight: 20 },
  hashtags: { fontSize: theme.fontSize.sm, color: theme.colors.primary, marginTop: theme.spacing.sm },
  commentsSection: { borderTopWidth: 1, borderTopColor: theme.colors.border, padding: theme.spacing.md, paddingBottom: 40 },
  commentsTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold, color: theme.colors.text, marginBottom: theme.spacing.md },
  
  // --- COMMENT STYLES ---
  commentContainer: { marginBottom: 16 },
  replyContainer: { marginLeft: 44, marginTop: 12 }, // Indent replies
  commentRow: { flexDirection: 'row', alignItems: 'flex-start' },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  commentContent: { flex: 1 },
  commentUser: { fontSize: 13, fontWeight: '600', color: '#000' },
  commentTime: { fontSize: 12, color: '#999', fontWeight: '400' },
  commentText: { fontSize: 14, color: '#333', marginTop: 2, lineHeight: 18 },
  commentActions: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtnText: { fontSize: 12, color: '#666', fontWeight: '600' },
  likesCountText: { fontSize: 12, color: '#666' },

  // --- MODAL & INPUT ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '80%', paddingTop: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalBody: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  inputContainer: { padding: 16, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff', paddingBottom: Platform.OS === 'ios' ? 34 : 16 },
  replyingToBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 8 },
  input: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginRight: 12 },
  postButtonText: { fontWeight: '600', fontSize: 16 },
  
  // --- SHARE MODAL ---
  externalShareContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20, paddingHorizontal: 10 },
  externalShareItem: { alignItems: 'center', gap: 8 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  externalShareText: { fontSize: 12, color: '#333', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#eee', marginHorizontal: 20, marginBottom: 16 },
  sectionHeader: { paddingHorizontal: 20, fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 10 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', marginHorizontal: 20, marginBottom: 16, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  searchInput: { flex: 1, fontSize: 16 },
  shareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sendButton: { backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  sendButtonText: { color: '#fff', fontWeight: '600' },
});