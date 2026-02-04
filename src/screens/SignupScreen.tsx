import React, { useState } from 'react';

import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthStackParamList } from '../types';

import { theme } from '../theme';

import { PrimaryButton } from '../components/PrimaryButton';

import { supabase } from '../lib/supabase';

import { ArrowLeft } from 'lucide-react-native';



type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;



export const SignupScreen = ({ navigation }: Props) => {

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');



  const validateEmail = (email: string): boolean => {

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(email);

  };



  const handleSignup = async () => {

    setError('');



    if (!email || !password || !confirmPassword) {

      setError('All fields are required');

      return;

    }



    if (!validateEmail(email)) {

      setError('Please enter a valid email address');

      return;

    }



    if (password.length < 6) {

      setError('Password must be at least 6 characters');

      return;

    }



    if (password !== confirmPassword) {

      setError('Passwords do not match');

      return;

    }



    setLoading(true);



    try {

      const { error: signUpError } = await supabase.auth.signUp({

        email,

        password,

      });



      if (signUpError) {

        setError(signUpError.message);

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

      <TouchableOpacity

        style={styles.backButton}

        onPress={() => navigation.goBack()}

      >

        <ArrowLeft size={24} color={theme.colors.text} />

      </TouchableOpacity>



      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        <View style={styles.content}>

          <Text style={styles.title}>Create your student account</Text>

          <Text style={styles.subtitle}>Join the campus community</Text>



          {error ? (

            <View style={styles.errorContainer}>

              <Text style={styles.errorText}>{error}</Text>

            </View>

          ) : null}



          <View style={styles.form}>

            <View style={styles.inputContainer}>

              <Text style={styles.label}>Email</Text>

              <TextInput

                style={styles.input}

                placeholder="your.email@gmail.com"

                value={email}

                onChangeText={setEmail}

                keyboardType="email-address"

                autoCapitalize="none"

                autoCorrect={false}

                placeholderTextColor={theme.colors.textMuted}

              />

            </View>



            <View style={styles.inputContainer}>

              <Text style={styles.label}>Password</Text>

              <TextInput

                style={styles.input}

                placeholder="Create a password"

                value={password}

                onChangeText={setPassword}

                secureTextEntry

                autoCapitalize="none"

                autoCorrect={false}

                placeholderTextColor={theme.colors.textMuted}

              />

            </View>



            <View style={styles.inputContainer}>

              <Text style={styles.label}>Confirm Password</Text>

              <TextInput

                style={styles.input}

                placeholder="Re-enter password"

                value={confirmPassword}

                onChangeText={setConfirmPassword}

                secureTextEntry

                autoCapitalize="none"

                autoCorrect={false}

                placeholderTextColor={theme.colors.textMuted}

              />

            </View>



            <PrimaryButton

              title={loading ? "Creating Account..." : "Sign Up"}

              onPress={handleSignup}

              disabled={loading}

              style={{ marginTop: theme.spacing.lg }}

            />



            <TouchableOpacity

              onPress={() => navigation.navigate('Welcome')}

              style={styles.loginLinkBottom}

            >

              <Text style={styles.loginLinkText}>

                Already have an account? <Text style={styles.loginLinkBold}>Log in</Text>

              </Text>

            </TouchableOpacity>

          </View>

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

  backButton: {

    position: 'absolute',

    top: 48,

    left: 16,

    zIndex: 10,

    width: 40,

    height: 40,

    borderRadius: 20,

    backgroundColor: theme.colors.white,

    justifyContent: 'center',

    alignItems: 'center',

    ...theme.shadows.sm,

  },

  scrollContent: {

    flexGrow: 1,

  },

  content: {

    flex: 1,

    paddingHorizontal: theme.spacing.lg,

    paddingTop: theme.spacing.xxl * 2,

    paddingBottom: theme.spacing.xl,

  },

  title: {

    fontSize: theme.fontSize.xxxl,

    fontWeight: theme.fontWeight.bold,

    color: theme.colors.text,

    marginBottom: theme.spacing.xs,

  },

  subtitle: {

    fontSize: theme.fontSize.md,

    color: theme.colors.textLight,

    marginBottom: theme.spacing.md,

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

  form: {

    marginTop: theme.spacing.sm,

  },

  inputContainer: {

    marginBottom: theme.spacing.md,

  },

  label: {

    fontSize: theme.fontSize.md,

    fontWeight: theme.fontWeight.medium,

    color: theme.colors.text,

    marginBottom: theme.spacing.sm,

  },

  input: {

    backgroundColor: theme.colors.backgroundLight,

    borderRadius: theme.borderRadius.lg,

    paddingHorizontal: theme.spacing.md,

    paddingVertical: theme.spacing.md,

    fontSize: theme.fontSize.md,

    color: theme.colors.text,

    borderWidth: 1,

    borderColor: theme.colors.border,

  },

  helperText: {

    fontSize: theme.fontSize.xs,

    color: theme.colors.textMuted,

    marginTop: theme.spacing.xs,

  },

  loginLinkBottom: {

    alignSelf: 'center',

    marginTop: theme.spacing.xl,

  },

  loginLinkText: {

    fontSize: theme.fontSize.sm,

    color: theme.colors.textLight,

    textAlign: 'center',

  },

  loginLinkBold: {

    color: theme.colors.primary,

    fontWeight: theme.fontWeight.semibold,

  },

});
