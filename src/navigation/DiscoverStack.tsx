import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DiscoverStackParamList } from '../types';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { PostDetailScreen } from '../screens/PostDetailScreen';

const Stack = createNativeStackNavigator<DiscoverStackParamList>();

export const DiscoverStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Discover" component={DiscoverScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
    </Stack.Navigator>
  );
};
