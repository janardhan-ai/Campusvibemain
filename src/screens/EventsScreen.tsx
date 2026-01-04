import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { mockEvents, Event } from '../data/events';

type Props = NativeStackScreenProps<HomeStackParamList, 'Events'>;

export const EventsScreen = ({ navigation }: Props) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Cultural', 'Technical', 'Sports', 'Workshop', 'Seminar', 'General'];

  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({
      tabBarStyle: { display: 'none' },
    });

    return () => {
      parent?.setOptions({
        tabBarStyle: {
          height: 56,
          paddingBottom: 6,
          paddingTop: 6,
          display: 'flex',
        },
      });
    };
  }, [navigation]);

  useEffect(() => {
    setEvents(mockEvents);
    setLoading(false);
  }, []);

  const filteredEvents = selectedCategory === 'All'
    ? events
    : events.filter(e => e.category === selectedCategory);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderEventCard = ({ item }: { item: Event }) => {
    const spotsLeft = item.max_attendees - item.current_attendees;

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
      >
        <Image source={{ uri: item.image_url }} style={styles.eventImage} />
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
            <View style={styles.dateTag}>
              <Ionicons name="calendar-outline" size={14} color={theme.colors.primary} />
              <Text style={styles.dateText}>
                {new Date(item.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
          </View>

          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.eventFooter}>
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={16} color={theme.colors.textLight} />
              <Text style={styles.infoText}>{item.location}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="people-outline" size={16} color={theme.colors.textLight} />
              <Text style={styles.infoText}>{spotsLeft} spots left</Text>
            </View>
          </View>

          <Text style={styles.collegeName}>{item.college_name}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Campus Events</Text>
        <TouchableOpacity onPress={() => setShowFilterModal(true)} style={styles.filterButton}>
          <Ionicons name="filter" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredEvents}
        keyExtractor={item => item.id}
        renderItem={renderEventCard}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={theme.colors.textLight} />
            <Text style={styles.emptyText}>No events found</Text>
          </View>
        }
      />

      <Modal visible={showFilterModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.filterModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Events</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterOptions}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterOption, selectedCategory === cat && styles.filterOptionActive]}
                  onPress={() => {
                    setSelectedCategory(cat);
                    setShowFilterModal(false);
                  }}
                >
                  <View style={styles.filterOptionContent}>
                    <Text style={[styles.filterOptionText, selectedCategory === cat && styles.filterOptionTextActive]}>
                      {cat}
                    </Text>
                    {selectedCategory === cat && (
                      <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
  },
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: theme.spacing.md,
  },
  eventCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  eventImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  eventContent: {
    padding: theme.spacing.md,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  categoryBadge: {
    backgroundColor: theme.colors.primaryLight + '30',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  categoryText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  dateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  eventTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  eventDescription: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
  },
  collegeName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },
  emptyText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textLight,
    marginTop: theme.spacing.md,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingBottom: theme.spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  filterOptions: {
    padding: theme.spacing.md,
  },
  filterOption: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterOptionActive: {
    backgroundColor: theme.colors.primaryLight + '15',
  },
  filterOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  filterOptionText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  filterOptionTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
});
