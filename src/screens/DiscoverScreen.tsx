import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, Modal } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DiscoverStackParamList } from '../types';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<DiscoverStackParamList, 'Discover'>;

const trendingTags = [
  { tag: '#CollegeLife', count: '12.5k', color: theme.colors.purple },
  { tag: '#TechFest2024', count: '8.2k', color: theme.colors.pink },
  { tag: '#Notes', count: '15.6k', color: theme.colors.green },
  { tag: '#Memes', count: '20.1k', color: theme.colors.blue },
];

export const DiscoverScreen = ({ navigation }: Props) => {
  const { posts } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={theme.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search students, posts, notes…"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="trending-up" size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Trending Now</Text>
              </View>
              <FlatList
                data={trendingTags}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item.tag}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.trendingChip, { backgroundColor: item.color }]}
                  >
                    <Text style={styles.trendingTag}>{item.tag}</Text>
                    <Text style={styles.trendingCount}>{item.count} posts</Text>
                  </TouchableOpacity>
                )}
              />
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="compass" size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Discover</Text>
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => setFilterVisible(true)}
                >
                  <Ionicons name="options-outline" size={20} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </>
        }
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.gridItem, index % 2 === 0 ? styles.gridItemLeft : styles.gridItemRight]}
            onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
          >
            <Image source={{ uri: item.image }} style={styles.gridImage} />
            <View style={styles.gridOverlay}>
              <View style={styles.gridStats}>
                <View style={styles.gridStat}>
                  <Ionicons name="heart" size={16} color={theme.colors.white} />
                  <Text style={styles.gridStatText}>{item.likes}</Text>
                </View>
                <View style={styles.gridStat}>
                  <Ionicons name="chatbubble" size={16} color={theme.colors.white} />
                  <Text style={styles.gridStatText}>{item.comments}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <Modal
        visible={filterVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterVisible(false)}
        >
          <View style={styles.filterModal}>
            <Text style={styles.filterTitle}>Filter by</Text>
            <TouchableOpacity style={styles.filterOption}>
              <Text style={styles.filterOptionText}>All Colleges</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterOption}>
              <Text style={styles.filterOptionText}>My College</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterOption}>
              <Text style={styles.filterOptionText}>Other Colleges</Text>
            </TouchableOpacity>
            <Text style={styles.filterTitle}>Content Type</Text>
            <TouchableOpacity style={styles.filterOption}>
              <Text style={styles.filterOptionText}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterOption}>
              <Text style={styles.filterOptionText}>Memes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterOption}>
              <Text style={styles.filterOptionText}>Notes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterOption}>
              <Text style={styles.filterOptionText}>Events</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  header: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl + 10,
    paddingBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  content: {
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  filterButton: {
    padding: theme.spacing.xs,
  },
  trendingChip: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginRight: theme.spacing.sm,
    minWidth: 140,
  },
  trendingTag: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  trendingCount: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.white,
    opacity: 0.9,
  },
  gridItem: {
    flex: 0.5,
    aspectRatio: 1,
    marginBottom: theme.spacing.sm,
  },
  gridItemLeft: {
    marginRight: theme.spacing.xs,
  },
  gridItemRight: {
    marginLeft: theme.spacing.xs,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.backgroundLight,
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.sm,
    borderBottomLeftRadius: theme.borderRadius.lg,
    borderBottomRightRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  gridStats: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  gridStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridStatText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModal: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: '80%',
    maxWidth: 300,
  },
  filterTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  filterOption: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterOptionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
});
