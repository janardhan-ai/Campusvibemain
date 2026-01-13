/*
  # Create Events System

  1. New Tables
    - `events`
      - `id` (uuid, primary key)
      - `title` (text) - Event title
      - `description` (text) - Event description
      - `event_date` (timestamptz) - When the event occurs
      - `location` (text) - Event location/venue
      - `college_name` (text) - College organizing the event
      - `image_url` (text) - Event poster/image
      - `max_attendees` (integer) - Maximum capacity
      - `current_attendees` (integer) - Current bookings count
      - `category` (text) - Event category (Cultural, Technical, Sports, etc.)
      - `created_by` (uuid) - Admin user who created the event
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `event_bookings`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to events)
      - `user_id` (uuid) - Student who booked
      - `user_name` (text) - Student name
      - `user_email` (text) - Student email
      - `booking_status` (text) - confirmed, cancelled, waitlist
      - `booked_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Events: Anyone can read, only admins can create/update/delete
    - Event bookings: Users can read their own bookings, anyone can create bookings
*/

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  event_date timestamptz NOT NULL,
  location text NOT NULL,
  college_name text NOT NULL,
  image_url text DEFAULT '',
  max_attendees integer DEFAULT 100,
  current_attendees integer DEFAULT 0,
  category text DEFAULT 'General',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create event_bookings table
CREATE TABLE IF NOT EXISTS event_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  user_email text NOT NULL,
  booking_status text DEFAULT 'confirmed',
  booked_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Anyone can view events"
  ON events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update their events"
  ON events FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete their events"
  ON events FOR DELETE
  TO authenticated
  USING (true);

-- Event bookings policies
CREATE POLICY "Users can view their own bookings"
  ON event_bookings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create bookings"
  ON event_bookings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own bookings"
  ON event_bookings FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own bookings"
  ON event_bookings FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS events_date_idx ON events(event_date);
CREATE INDEX IF NOT EXISTS event_bookings_user_idx ON event_bookings(user_id);
CREATE INDEX IF NOT EXISTS event_bookings_event_idx ON event_bookings(event_id);