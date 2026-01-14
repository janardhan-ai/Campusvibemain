/*
  # Fix Profiles INSERT Policy

  The original INSERT policy had a USING clause which is not supported for INSERT operations.
  INSERT policies should only use WITH CHECK to validate the data being inserted.
  
  This migration removes the incorrect USING clause and keeps only WITH CHECK.
*/

DROP POLICY IF EXISTS "Users can create own profile" ON profiles;

CREATE POLICY "Users can create own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);