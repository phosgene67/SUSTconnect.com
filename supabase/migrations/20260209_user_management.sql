-- Add user management fields to profiles table
ALTER TABLE profiles 
ADD COLUMN user_type VARCHAR(50) DEFAULT 'student' CHECK (user_type IN ('student', 'teacher', 'alumni', 'developer')),
ADD COLUMN status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'banned', 'restricted')),
ADD COLUMN banned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN ban_reason TEXT,
ADD COLUMN restrictions JSONB DEFAULT '{}';

-- Create index for user_type for faster filtering
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_profiles_status ON profiles(status);

-- RPC function to get all users (admin only)
CREATE OR REPLACE FUNCTION get_all_users(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  department TEXT,
  batch TEXT,
  user_type VARCHAR,
  status VARCHAR,
  banned_at TIMESTAMP WITH TIME ZONE,
  ban_reason TEXT,
  restrictions JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is developer
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = p_user_id AND role = 'developer'
  ) THEN
    RAISE EXCEPTION 'Only developers can access user management';
  END IF;

  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name,
    u.email,
    p.avatar_url,
    p.department,
    p.batch,
    p.user_type,
    p.status,
    p.banned_at,
    p.ban_reason,
    p.restrictions,
    u.created_at
  FROM profiles p
  JOIN auth.users u ON p.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

-- RPC function to ban a user
CREATE OR REPLACE FUNCTION ban_user(p_admin_id UUID, p_target_user_id UUID, p_reason TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if admin is developer
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = p_admin_id AND role = 'developer'
  ) THEN
    RAISE EXCEPTION 'Only developers can ban users';
  END IF;

  -- Update user status
  UPDATE profiles
  SET 
    status = 'banned',
    banned_at = NOW(),
    ban_reason = p_reason
  WHERE user_id = p_target_user_id;
END;
$$;

-- RPC function to unban a user
CREATE OR REPLACE FUNCTION unban_user(p_admin_id UUID, p_target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if admin is developer
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = p_admin_id AND role = 'developer'
  ) THEN
    RAISE EXCEPTION 'Only developers can unban users';
  END IF;

  -- Update user status
  UPDATE profiles
  SET 
    status = 'active',
    banned_at = NULL,
    ban_reason = NULL
  WHERE user_id = p_target_user_id;
END;
$$;

-- RPC function to update user type
CREATE OR REPLACE FUNCTION update_user_type(p_admin_id UUID, p_target_user_id UUID, p_user_type VARCHAR)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if admin is developer
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = p_admin_id AND role = 'developer'
  ) THEN
    RAISE EXCEPTION 'Only developers can update user types';
  END IF;

  -- Validate user_type
  IF p_user_type NOT IN ('student', 'teacher', 'alumni', 'developer') THEN
    RAISE EXCEPTION 'Invalid user type: %', p_user_type;
  END IF;

  -- Update user type
  UPDATE profiles
  SET user_type = p_user_type
  WHERE user_id = p_target_user_id;
END;
$$;

-- RPC function to update user restrictions
CREATE OR REPLACE FUNCTION update_user_restrictions(p_admin_id UUID, p_target_user_id UUID, p_restrictions JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if admin is developer
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = p_admin_id AND role = 'developer'
  ) THEN
    RAISE EXCEPTION 'Only developers can update restrictions';
  END IF;

  -- Update restrictions
  UPDATE profiles
  SET restrictions = p_restrictions
  WHERE user_id = p_target_user_id;
END;
$$;
