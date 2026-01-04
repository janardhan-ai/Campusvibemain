import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<ProfileStackParamList, 'FollowersScreen'>;

export const FollowersScreen = ({ navigation, route }: Props) => {
  const { userId } = route.params;
  const { currentUser } = useApp();
  
  // Is this the logged-in user's own list?
  const isOwnList = currentUser?.id === userId;

  // DUMMY DATA (Replace with AppContext/Supabase fetch later)
  const [followers, setFollowers] = useState([
    { id: '101', name: 'Rahul Kumar', username: 'rahul_k', avatar: 'https://i.pravatar.cc/150?u=101' },
    { id: '102', name: 'Priya Sharma', username: 'priya_s', avatar: 'https://i.pravatar.cc/150?u=102' },
    { id: '103', name: 'Amit Verma', username: 'amit_v', avatar: 'https://i.pravatar.cc/150?u=103' },
  ]);

  const handleRemove = (followerId: string, followerName: string) => {
    Alert.alert(
      "Remove Follower?",
      `Are you sure you want to remove ${followerName}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: () => {
            // 1. Call Backend (removeFollower function) here
            // await removeFollower(followerId);
            
            // 2. Optimistic Update (Remove from list immediately)
            setFollowers(prev => prev.filter(user => user.id !== followerId));
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.userRow}>
      <TouchableOpacity style={styles.userInfo}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.username}>@{item.username}</Text>
        </View>
      </TouchableOpacity>

      {/* Show REMOVE button only if it's my own list */}
      {isOwnList && (
        <TouchableOpacity 
          style={styles.removeButton} 
          onPress={() => handleRemove(item.id, item.name)}
        >
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Followers</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={followers}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No followers yet.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border, marginTop: 40 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  listContainer: { padding: 16 },
  userRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eee' },
  name: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  username: { fontSize: 14, color: theme.colors.textMuted },
  removeButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f2f2f2', borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  removeButtonText: { fontSize: 12, fontWeight: '600', color: '#000' },
  emptyText: { textAlign: 'center', marginTop: 40, color: theme.colors.textMuted }
});