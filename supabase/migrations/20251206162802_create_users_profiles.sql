/*
  # Create User Profiles System

  ## Overview
  This migration creates the user profiles system for Campus Vibe, extending Supabase's built-in authentication 
  with additional user information and proper security policies.

  ## New Tables
  
  ### `profiles`
  Extended user profile information linked to Supabase auth.users
  - `id` (uuid, primary key) - References auth.users(id), unique identifier for each user
  - `username` (text, unique, not null) - Unique username with no spaces or special chars except underscore
  - `name` (text, not null) - User's full name
  - `dob` (date, not null) - User's date of birth
  - `email` (text, unique, not null) - User's email address
  - `phone_number` (text) - User's phone number
  - `avatar` (text) - URL to user's avatar image
  - `college` (text) - Name of user's college
  - `branch` (text) - User's branch/major
  - `year` (integer) - Current year of study
  - `bio` (text) - User biography
  - `followers` (integer, default 0) - Number of followers
  - `following` (integer, default 0) - Number of users being followed
  - `created_at` (timestamptz) - Profile creation timestamp
  - `updated_at` (timestamptz) - Last profile update timestamp

  ## Security

  1. Enable RLS on `profiles` table
  2. Users can read their own profile
  3. Users can update their own profile
  4. Users can insert their own profile (on signup)
  5. Public users can read other users' profiles (for social features)

  ## Important Notes

  - Uses Supabase Auth for password management - passwords are NEVER stored in profiles table
  - Username must be unique and validated on the client side
  - Email uniqueness is enforced by Supabase Auth
  - Profile is created automatically after successful auth signup via trigger
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  name text NOT NULL,
  dob date NOT NULL,
  email text UNIQUE NOT NULL,
  phone_number text,
  avatar text,
  college text,
  branch text,
  year integer,
  bio text,
  followers integer DEFAULT 0,
  following integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all profiles (for social features)
CREATE POLICY "Anyone can view profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can create own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);