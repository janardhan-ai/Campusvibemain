// src/navigation/HomeStack.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { HomeScreen } from '../screens/HomeScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { EventsScreen } from '../screens/EventsScreen';
import { EventDetailScreen } from '../screens/EventDetailScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { ChatDetailScreen } from '../screens/ChatDetailScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PostDetailScreen } from '../screens/PostDetailScreen';

// --- IMPORT THESE ---
import { FollowersScreen } from '../screens/FollowersScreen';
import { FollowingScreen } from '../screens/FollowingScreen';
import { NoteDetailScreen } from '../screens/NoteDetailScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export const HomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      
      {/* Ensure name is "PostDetailScreen" to match your navigation code */}
      <Stack.Screen name="PostDetailScreen" component={PostDetailScreen} />
      
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Events" component={EventsScreen} />
      
      {/* Ensure name is "EventDetailScreen" */}
      <Stack.Screen name="EventDetailScreen" component={EventDetailScreen} />
      
      <Stack.Screen name="Messages" component={MessagesScreen} />
      <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />

      {/* --- ADD THESE SCREENS TO FIX THE CRASHES --- */}
      <Stack.Screen name="FollowersScreen" component={FollowersScreen} />
      <Stack.Screen name="FollowingScreen" component={FollowingScreen} />
      <Stack.Screen name="NoteDetailScreen" component={NoteDetailScreen} />

    </Stack.Navigator>
  );
};