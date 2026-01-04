import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<ProfileStackParamList, 'FollowingScreen'>;

export const FollowingScreen = ({ navigation, route }: Props) => {
  const { userId } = route.params;
  const { currentUser } = useApp();
  
  const isOwnList = currentUser?.id === userId;

  // DUMMY DATA
  const [following, setFollowing] = useState([
    { id: '201', name: 'Elon Musk', username: 'elonmusk', avatar: 'https://i.pravatar.cc/150?u=201' },
    { id: '202', name: 'Bill Gates', username: 'billgates', avatar: 'https://i.pravatar.cc/150?u=202' },
  ]);

  const handleUnfollow = (targetId: string, targetName: string) => {
    Alert.alert(
      "Unfollow?",
      `Stop following ${targetName}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Unfollow", 
          style: "destructive",
          onPress: () => {
            // 1. Call Backend (unfollowUser function)
            // await unfollowUser(targetId);

            // 2. Optimistic Update
            setFollowing(prev => prev.filter(user => user.id !== targetId));
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

      {/* Show Following/Unfollow button if it's my list */}
      {isOwnList && (
        <TouchableOpacity 
          style={styles.followingButton} 
          onPress={() => handleUnfollow(item.id, item.name)}
        >
          <Text style={styles.followingButtonText}>Following</Text>
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
        <Text style={styles.headerTitle}>Following</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={following}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Not following anyone yet.</Text>
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
  followingButton: { paddingHorizontal: 16, paddingVertical: 6, backgroundColor: '#e5e5ea', borderRadius: 8 },
  followingButtonText: { fontSize: 12, fontWeight: '600', color: '#000' },
  emptyText: { textAlign: 'center', marginTop: 40, color: theme.colors.textMuted }
});