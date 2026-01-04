import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Zap, Heart, MessageCircle, Share, Eye, Plus, MapPin, Music } from 'lucide-react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React from "react";

const mockVibes = [
  {
    id: 1,
    username: 'rahul_memes',
    userImage: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
    image: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=400&h=711',
    caption: 'When the professor says "This will be in the exam" 😂',
    likes: 1247,
    comments: 89,
    views: 2341,
    location: 'IIT Delhi Library',
    music: 'Study Vibes Playlist',
    timeAgo: '2h',
    tags: ['@priya_codes', '@arjun_dev'],
  },
  {
    id: 2,
    username: 'priya_codes',
    userImage: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
    image: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400&h=711',
    caption: 'Late night coding session 💻✨ #CodeLife',
    likes: 892,
    comments: 45,
    views: 1876,
    location: 'Computer Lab B',
    music: 'Lo-fi Hip Hop',
    timeAgo: '4h',
    tags: ['@rahul_memes'],
  },
  {
    id: 3,
    username: 'arjun_dev',
    userImage: 'https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg?auto=compress&cs=tinysrgb&w=150',
    image: 'https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=400&h=711',
    caption: 'Campus sunset hits different 🌅',
    likes: 1534,
    comments: 67,
    views: 3245,
    location: 'Main Campus Ground',
    music: 'Chill Vibes',
    timeAgo: '6h',
    tags: [],
  },
  {
    id: 4,
    username: 'sneha_art',
    userImage: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
    image: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=400&h=711',
    caption: 'Art therapy session 🎨 Finding peace in colors',
    likes: 756,
    comments: 23,
    views: 1432,
    location: 'Art Studio',
    music: 'Peaceful Piano',
    timeAgo: '8h',
    tags: ['@creative_minds'],
  },
];

export default function VibesScreen() {
  const handleCreateVibe = () => {
    router.push('/vibes/camera');
  };

  const renderVibeItem = ({ item }: { item: typeof mockVibes[0] }) => (
    <View style={styles.vibePost}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <Image source={{ uri: item.userImage }} style={styles.avatar} />
          <View style={styles.userDetails}>
            <Text style={styles.username}>{item.username}</Text>
            <View style={styles.metaInfo}>
              <MapPin size={12} color="#6B7280" />
              <Text style={styles.location}>{item.location}</Text>
              <Text style={styles.timestamp}> • {item.timeAgo}</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Vibe Content */}
      <View style={styles.vibeContent}>
        <Image source={{ uri: item.image }} style={styles.vibeImage} />
        
        {/* Music overlay */}
        {item.music && (
          <View style={styles.musicOverlay}>
            <Music size={14} color="white" />
            <Text style={styles.musicText}>{item.music}</Text>
          </View>
        )}

        {/* Views overlay */}
        <View style={styles.viewsOverlay}>
          <Eye size={14} color="white" />
          <Text style={styles.viewsText}>{item.views.toLocaleString()}</Text>
        </View>
      </View>

      {/* Post Actions */}
      <View style={styles.postActions}>
        <View style={styles.leftActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Heart size={24} color="#EF4444" />
            <Text style={styles.actionText}>{item.likes.toLocaleString()}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MessageCircle size={24} color="#6B7280" />
            <Text style={styles.actionText}>{item.comments}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Share size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Caption and Tags */}
      <View style={styles.captionSection}>
        <Text style={styles.caption}>
          <Text style={styles.usernameInCaption}>{item.username}</Text> {item.caption}
        </Text>
        {item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.map((tag, index) => (
              <Text key={index} style={styles.tag}>{tag}</Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Zap size={18} color="white" />
          </LinearGradient>
          <Text style={styles.title}>Vibes</Text>
        </View>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateVibe}>
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Vibes Feed */}
      <FlatList
        data={mockVibes}
        renderItem={renderVibeItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContainer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  feedContainer: {
    paddingVertical: 8,
  },
  vibePost: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  postHeader: {
    padding: 16,
    paddingBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  vibeContent: {
    position: 'relative',
  },
  vibeImage: {
    width: '100%',
    aspectRatio: 9/16,
    resizeMode: 'cover',
  },
  musicOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  musicText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  viewsOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  viewsText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 6,
  },
  captionSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  caption: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
    marginBottom: 8,
  },
  usernameInCaption: {
    fontWeight: '600',
    color: '#1F2937',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
});