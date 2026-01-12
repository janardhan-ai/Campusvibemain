/*
  # Add UNIQUE constraint to phone_number

  1. Changes
    - Add UNIQUE constraint to phone_number column in profiles table
    - This enforces uniqueness at the database level in addition to application-level validation
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'profiles' AND constraint_name = 'profiles_phone_number_key'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_phone_number_key UNIQUE (phone_number);
  END IF;
END $$;