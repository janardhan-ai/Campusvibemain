import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NotesStackParamList } from '../types';
import { NotesScreen } from '../screens/NotesScreen';
import { NoteDetailScreen } from '../screens/NoteDetailScreen';

const Stack = createNativeStackNavigator<NotesStackParamList>();

export const NotesStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Notes" component={NotesScreen} />
      <Stack.Screen name="NoteDetail" component={NoteDetailScreen} />
    </Stack.Navigator>
  );
};
