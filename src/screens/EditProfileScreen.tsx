import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { ProfileStackParamList } from '../types';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import { PrimaryButton } from '../components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

export const EditProfileScreen = ({ navigation }: Props) => {
  const { currentUser, setCurrentUser } = useApp();

  // State Management
  const [avatar, setAvatar] = useState(currentUser?.avatar || null);
  const [name, setName] = useState(currentUser?.name || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  
  // Academic State
  const [college, setCollege] = useState(currentUser?.college || '');
  const [branch, setBranch] = useState(currentUser?.branch || '');
  const [year, setYear] = useState(currentUser?.year?.toString() || '');

  // Skills State
  const existingSkills = (currentUser as any)?.skills || [];
  const [skill1, setSkill1] = useState(existingSkills[0] || '');
  const [skill2, setSkill2] = useState(existingSkills[1] || '');

  // Image Picker
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'You need to allow access to your photos to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], 
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    // Validation - Skills removed from check
    if (!name.trim() || !username.trim() || !college.trim() || !branch.trim() || !year.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields (Name, Username, College, Branch, Year).');
      return;
    }

    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        name,
        username,
        bio,
        avatar: avatar || currentUser.avatar,
        college,
        branch,
        year: parseInt(year) || 1,
        // Filter out empty skills so we don't save blank strings
        skills: [skill1, skill2].filter(s => s.trim() !== ''),
      };

      // @ts-ignore 
      setCurrentUser(updatedUser);
      
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color={theme.colors.textMuted} />
              </View>
            )}
            <View style={styles.cameraIconBadge}>
              <Ionicons name="camera" size={16} color="white" />
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Change Profile Photo</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Name <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            value={name}
            onChangeText={setName}
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Username <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Your username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell something about yourself..."
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={3}
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>

        {/* Skills Section - Removed Required Asterisk */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Top Skills</Text>
          <View style={styles.skillsRow}>
            <TextInput
              style={[styles.input, styles.skillInput]}
              placeholder="Skill 1"
              value={skill1}
              onChangeText={setSkill1}
              placeholderTextColor={theme.colors.textMuted}
            />
            <View style={{width: 10}} />
            <TextInput
              style={[styles.input, styles.skillInput]}
              placeholder="Skill 2"
              value={skill2}
              onChangeText={setSkill2}
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>
        </View>

        {/* Academic Info */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>College <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={college}
            onChangeText={setCollege}
            placeholder="Enter College Name"
            placeholderTextColor={theme.colors.textMuted}
          />
          <Text style={styles.hint}>Note: Please enter the College Short Form only (e.g., IITB, SRM)</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Branch <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={branch}
            onChangeText={setBranch}
            placeholder="Enter Branch (e.g. CSE)"
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Year <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={year}
            onChangeText={setYear}
            keyboardType="numeric"
            placeholder="Current Year(1-4)"
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>

        <PrimaryButton title="Save Changes" onPress={handleSave} style={{ marginTop: theme.spacing.md, marginBottom: 40 }} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl + 10,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
  },
  inputContainer: {
    marginBottom: 12, // Compact spacing
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: 6,
  },
  required: {
    color: 'red',
  },
  input: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  changePhotoText: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
    fontSize: theme.fontSize.sm,
  },
  skillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skillInput: {
    flex: 1,
  },
});