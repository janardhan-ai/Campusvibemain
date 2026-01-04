import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types';

// --- Screen Imports ---
import { ProfileScreen } from '../screens/ProfileScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { FollowersScreen } from '../screens/FollowersScreen';
import { FollowingScreen } from '../screens/FollowingScreen';
import { PostDetailScreen } from '../screens/PostDetailScreen';
import { EventDetailScreen } from '../screens/EventDetailScreen';
import { NoteDetailScreen } from '../screens/NoteDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ChatDetailScreen } from '../screens/ChatDetailScreen';
import { CreateScreen } from '../screens/CreateScreen'; // Uncomment if this exists in this stack

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Profile"
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Root Screen */}
      <Stack.Screen name="Profile" component={ProfileScreen} />

      {/* Profile Actions */}
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />

      {/* Social Connections */}
      <Stack.Screen name="FollowersScreen" component={FollowersScreen} />
      <Stack.Screen name="FollowingScreen" component={FollowingScreen} />

      {/* Content Details */}
      <Stack.Screen name="PostDetailScreen" component={PostDetailScreen} />
      <Stack.Screen name="EventDetailScreen" component={EventDetailScreen} />
      <Stack.Screen name="NoteDetailScreen" component={NoteDetailScreen} />

      {/* Chat (Accessed via Message Button) */}
      <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
      <Stack.Screen name="CreateScreen" component={CreateScreen} />
      
    </Stack.Navigator>
  );
};