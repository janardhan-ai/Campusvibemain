import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Settings'>;

export const SettingsScreen = ({ navigation }: Props) => {
  const { setCurrentUser } = useApp();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => setCurrentUser(null),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.item}>
          <View style={styles.itemLeft}>
            <Ionicons name="person-outline" size={24} color={theme.colors.text} />
            <Text style={styles.itemText}>Account</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.item}>
          <View style={styles.itemLeft}>
            <Ionicons name="lock-closed-outline" size={24} color={theme.colors.text} />
            <Text style={styles.itemText}>Privacy</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.item}>
          <View style={styles.itemLeft}>
            <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
            <Text style={styles.itemText}>Notifications</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.item}>
          <View style={styles.itemLeft}>
            <Ionicons name="help-circle-outline" size={24} color={theme.colors.text} />
            <Text style={styles.itemText}>Help & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.item}>
          <View style={styles.itemLeft}>
            <Ionicons name="information-circle-outline" size={24} color={theme.colors.text} />
            <Text style={styles.itemText}>About</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.item, styles.logoutItem]} onPress={handleLogout}>
          <View style={styles.itemLeft}>
            <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
            <Text style={[styles.itemText, styles.logoutText]}>Logout</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl + 10,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    paddingTop: theme.spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    marginBottom: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  itemText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  logoutItem: {
    marginTop: theme.spacing.lg,
  },
  logoutText: {
    color: theme.colors.error,
    fontWeight: theme.fontWeight.medium,
  },
});
