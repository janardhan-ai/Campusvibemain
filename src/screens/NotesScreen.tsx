import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NotesStackParamList } from '../types';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import { NoteCard } from '../components/NoteCard';
import { Picker } from '@react-native-picker/picker';

type Props = NativeStackScreenProps<NotesStackParamList, 'Notes'>;

export const NotesScreen = ({ navigation }: Props) => {
  const { notes } = useApp();
  const [collegeFilter, setCollegeFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notes</Text>
      </View>

      <View style={styles.filters}>
        <View style={styles.filterItem}>
          <Text style={styles.filterLabel}>College</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={collegeFilter}
              onValueChange={setCollegeFilter}
              style={styles.picker}
            >
              <Picker.Item label="All Colleges" value="all" />
              <Picker.Item label="My College" value="my" />
            </Picker>
          </View>
        </View>

        <View style={styles.filterItem}>
          <Text style={styles.filterLabel}>Subject</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={subjectFilter}
              onValueChange={setSubjectFilter}
              style={styles.picker}
            >
              <Picker.Item label="All Subjects" value="all" />
              <Picker.Item label="CSE" value="cse" />
              <Picker.Item label="ECE" value="ece" />
              <Picker.Item label="EEE" value="eee" />
            </Picker>
          </View>
        </View>
      </View>

      <FlatList
        data={notes}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <NoteCard note={item} onPress={() => navigation.navigate('NoteDetail', { noteId: item.id })} />
        )}
      />
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl + 10,
    paddingBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  filters: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  pickerContainer: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
  },
  content: {
    padding: theme.spacing.md,
  },
});
