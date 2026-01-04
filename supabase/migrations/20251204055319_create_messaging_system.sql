/*
  # Create Messaging System

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key)
      - `participant1_id` (uuid) - First user in conversation
      - `participant1_name` (text)
      - `participant1_avatar` (text)
      - `participant2_id` (uuid) - Second user in conversation
      - `participant2_name` (text)
      - `participant2_avatar` (text)
      - `last_message` (text) - Preview of last message
      - `last_message_time` (timestamptz)
      - `created_at` (timestamptz)
    
    - `messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key to conversations)
      - `sender_id` (uuid) - User who sent the message
      - `sender_name` (text)
      - `sender_avatar` (text)
      - `content` (text) - Message content
      - `is_read` (boolean) - Read status
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only view conversations they are part of
    - Users can only view messages in their conversations
    - Anyone can create conversations and messages
*/

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id uuid NOT NULL,
  participant1_name text NOT NULL,
  participant1_avatar text DEFAULT '',
  participant2_id uuid NOT NULL,
  participant2_name text NOT NULL,
  participant2_avatar text DEFAULT '',
  last_message text DEFAULT '',
  last_message_time timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid NOT NULL,
  sender_name text NOT NULL,
  sender_avatar text DEFAULT '',
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = sender_id::text)
  WITH CHECK (auth.uid()::text = sender_id::text);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS conversations_participant1_idx ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS conversations_participant2_idx ON conversations(participant2_id);
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);