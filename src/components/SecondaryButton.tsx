import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../theme';

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
}

export const SecondaryButton = ({ title, onPress, style }: SecondaryButtonProps) => {
  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  text: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});
