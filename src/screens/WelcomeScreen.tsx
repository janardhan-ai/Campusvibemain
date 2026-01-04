import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types';
import { theme } from '../theme';
import { supabase } from '../lib/supabase';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen = ({ navigation }: Props) => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');

    if (!emailOrUsername || !password) {
      setError('Please enter your email/username and password');
      return;
    }

    setLoading(true);

    try {
      let loginEmail = emailOrUsername;

      if (!emailOrUsername.includes('@')) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', emailOrUsername)
          .maybeSingle();

        if (!profile) {
          setError('Username not found');
          setLoading(false);
          return;
        }

        loginEmail = profile.email;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (signInError) {
        setError('Invalid email/username or password');
        setLoading(false);
        return;
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/image copy.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Welcome to CampusVibe</Text>
          <Text style={styles.subtitle}>Sign to continue</Text>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email or Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email or username"
              placeholderTextColor={theme.colors.textMuted}
              value={emailOrUsername}
              onChangeText={setEmailOrUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={theme.colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.signupButton}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.signupButtonText}>Create New Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.xxl * 1.5,
    marginBottom: theme.spacing.xl,
  },
  logo: {
    width: 140,
    height: 140,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#fee',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#fcc',
  },
  errorText: {
    color: '#c00',
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.white,
  },
  loginButton: {
    height: 52,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    ...theme.shadows.md,
  },
  loginButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    fontWeight: theme.fontWeight.medium,
  },
  signupButton: {
    height: 52,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  signupButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});
