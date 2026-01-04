import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Image 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker'; 
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import { PrimaryButton } from '../components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';

// --- SMART ASPECT RATIO LOGIC ---
import { getSmartAspectRatio } from './utils/aspectRatio'; 

type TabType = 'post' | 'story' | 'notes';

export const CreateScreen = () => {
  const [activeTab, setActiveTab] = useState<TabType>('post');
  
  // Input States
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [visibility, setVisibility] = useState<'my_college' | 'all_colleges' | 'followers'>('all_colleges');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  
  // Image States
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState(1); 
  // NEW: Store dimensions to send to DB
  const [imageDimensions, setImageDimensions] = useState({ width: 1080, height: 1080 });

  const { addPost, addNote, currentUser } = useApp();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your photos to create a post.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      // allowsEditing: false, <--- IMPORTANT: Keep false to get original aspect ratio
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      
      // 1. Calculate Smart Ratio for Preview
      const smartRatio = getSmartAspectRatio(asset.width, asset.height);
      
      // 2. Set State
      setSelectedImage(asset.uri);
      setAspectRatio(smartRatio);
      setImageDimensions({ width: asset.width, height: asset.height });
    }
  };

  const handlePost = () => {
    if (!currentUser) return;

    if (activeTab === 'post') {
      if (!caption.trim()) {
        Alert.alert('Error', 'Please add a caption');
        return;
      }
      
      const imageToPost = selectedImage || 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800';

      addPost({
        userId: currentUser.id,
        user: currentUser,
        image: imageToPost, 
        // 3. PASS DIMENSIONS TO DB (So Feed & Detail screens know the ratio)
        width: imageDimensions.width,
        height: imageDimensions.height,
        caption,
        description,
        hashtags: hashtags.split(' ').filter(tag => tag.startsWith('#')),
        visibility,
      });
      
      Alert.alert('Success', 'Post created successfully!');
      
      // Reset Form
      setCaption('');
      setDescription('');
      setHashtags('');
      setSelectedImage(null); 
      setAspectRatio(1);
    } else if (activeTab === 'story') {
      Alert.alert('Success', 'Story shared successfully!');
      setCaption('');
    } else if (activeTab === 'notes') {
      if (!title.trim() || !subject.trim()) {
        Alert.alert('Error', 'Please fill title and subject');
        return;
      }
      addNote({
        userId: currentUser.id,
        user: currentUser,
        title,
        subject,
        description,
        resourceType: 'pdf',
      });
      Alert.alert('Success', 'Note published successfully!');
      setTitle('');
      setSubject('');
      setDescription('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create</Text>
        <Text style={styles.subtitle}>Share your college moments</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'post' && styles.activeTab]}
          onPress={() => setActiveTab('post')}
        >
          <Text style={[styles.tabText, activeTab === 'post' && styles.activeTabText]}>Post</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'story' && styles.activeTab]}
          onPress={() => setActiveTab('story')}
        >
          <Text style={[styles.tabText, activeTab === 'story' && styles.activeTabText]}>Story</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'notes' && styles.activeTab]}
          onPress={() => setActiveTab('notes')}
        >
          <Text style={[styles.tabText, activeTab === 'notes' && styles.activeTabText]}>Notes</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        
        {/* --- IMAGE PREVIEW WITH SMART RATIO --- */}
        {selectedImage ? (
          <View style={styles.previewContainer}>
            <Image 
              source={{ uri: selectedImage }} 
              style={[
                styles.previewImage, 
                { aspectRatio: aspectRatio } // Applied dynamically
              ]} 
            />
            <TouchableOpacity style={styles.changeButton} onPress={pickImage}>
              <Ionicons name="camera-reverse" size={20} color="#fff" />
              <Text style={styles.changeButtonText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
            <Ionicons name="cloud-upload-outline" size={48} color={theme.colors.primary} />
            <Text style={styles.uploadText}>Choose File *</Text>
            <Text style={styles.uploadButton}>Browse Gallery</Text>
          </TouchableOpacity>
        )}

        {activeTab === 'post' && (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Caption *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What's on your mind? Share your story…"
                value={caption}
                onChangeText={setCaption}
                multiline
                numberOfLines={3}
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add more details..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Hashtags / Tags (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="#CollegeLife #Coding"
                value={hashtags}
                onChangeText={setHashtags}
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Visibility</Text>
              <View style={styles.visibilityOptions}>
                <TouchableOpacity
                  style={[styles.visibilityOption, visibility === 'my_college' && styles.visibilityOptionActive]}
                  onPress={() => setVisibility('my_college')}
                >
                  <Text style={[styles.visibilityText, visibility === 'my_college' && styles.visibilityTextActive]}>
                    My College
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.visibilityOption, visibility === 'all_colleges' && styles.visibilityOptionActive]}
                  onPress={() => setVisibility('all_colleges')}
                >
                  <Text style={[styles.visibilityText, visibility === 'all_colleges' && styles.visibilityTextActive]}>
                    All Colleges
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.visibilityOption, visibility === 'followers' && styles.visibilityOptionActive]}
                  onPress={() => setVisibility('followers')}
                >
                  <Text style={[styles.visibilityText, visibility === 'followers' && styles.visibilityTextActive]}>
                    Followers
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <PrimaryButton title="Post" onPress={handlePost} style={{ marginTop: theme.spacing.lg }} />
          </>
        )}

        {activeTab === 'story' && (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Caption (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add a caption..."
                value={caption}
                onChangeText={setCaption}
                multiline
                numberOfLines={2}
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>

            <PrimaryButton title="Share to Story" onPress={handlePost} style={{ marginTop: theme.spacing.lg }} />
          </>
        )}

        {activeTab === 'notes' && (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., DSP Unit-3 Short Notes"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Course / Subject *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Digital Signal Processing"
                value={subject}
                onChangeText={setSubject}
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description or Summary</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Brief description of the notes..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>

            <PrimaryButton title="Publish Note" onPress={handlePost} style={{ marginTop: theme.spacing.lg }} />
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl + 10,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.white,
    ...theme.shadows.sm,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textMuted,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
  },
  uploadBox: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  uploadText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  uploadButton: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
    marginTop: theme.spacing.xs,
  },
  previewContainer: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
    position: 'relative',
    // We removed 'height' here to let aspect ratio control it
  },
  previewImage: {
    width: '100%',
    // Height is determined automatically by aspect ratio
    resizeMode: 'cover',
  },
  changeButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  changeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  visibilityOptions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  visibilityOption: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  visibilityOptionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  visibilityText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  visibilityTextActive: {
    color: theme.colors.white,
  },
});