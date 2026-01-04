import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../types';
import { HomeStack } from './HomeStack';
import { DiscoverStack } from './DiscoverStack';
import { NotesStack } from './NotesStack';
import { ProfileStack } from './ProfileStack';
import VibesScreen from '../screens/VibesScreen';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

const Tab = createBottomTabNavigator<TabParamList>();

export const AppTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          height: 56,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="HomeStack"
        component={HomeStack}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="DiscoverStack"
        component={DiscoverStack}
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />

      {/* ⚡ VIBES TAB (Electric / Spark Icon) */}
      <Tab.Screen
        name="Vibes"
        component={VibesScreen}
        options={{
          title: 'Vibes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flash" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="NotesStack"
        component={NotesStack}
        options={{
          title: 'Notes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="ProfileStack"
        component={ProfileStack}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
