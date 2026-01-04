import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../theme';

interface ChipProps {
  label: string;
  onPress?: () => void;
  color?: string;
  style?: ViewStyle;
}

export const Chip = ({ label, onPress, color = theme.colors.primary, style }: ChipProps) => {
  return (
    <TouchableOpacity
      style={[styles.chip, { backgroundColor: color }, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
  },
  text: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
});
