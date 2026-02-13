-- Migration: Add nickname field to profiles
-- Run this in your Supabase SQL Editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Update the trigger function to set nickname from display_name by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name, nickname)
    VALUES (new.id, new.email, new.email, NULL);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
