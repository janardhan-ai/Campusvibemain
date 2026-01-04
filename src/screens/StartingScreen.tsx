import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types';
import { theme } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Starting'>;

export const StartingScreen = ({ navigation }: Props) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Welcome');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/campus_vibe.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '90%',
    height: 600,
  },
});
