# Supabase Setup Guide

## Step 1: Create a Supabase Account and Project

1. Go to https://supabase.com
2. Click **"Start your project"** or **"Sign Up"**
3. Sign up with GitHub, Google, or email
4. Once logged in, click **"New Project"**
5. Fill in the project details:
   - **Name**: LinkedOut (or whatever you prefer)
   - **Database Password**: Create a strong password (save this somewhere safe!)
   - **Region**: Choose the closest region to you
6. Click **"Create new project"** (this takes a few minutes)

## Step 2: Get Your Connection Details

1. Once your project is ready, go to your project dashboard
2. Click on the **Settings** icon (gear icon) in the left sidebar
3. Click **"API"** in the settings menu
4. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **Project API keys** - You need the **`anon` `public`** key (not the service_role key)

## Step 3: Set Environment Variables

You need to add these to your project. In Lovable, you'll need to:

1. Find your project settings/environment variables section
2. Or create a `.env` file in your project root with:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (your anon/public key)
```

**In Lovable specifically:**
- Look for "Environment Variables" or "Secrets" in your project settings
- Add these two variables there

## Step 4: Create the Profiles Table

1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Copy and paste this entire SQL script:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  industry TEXT,
  favorite_food TEXT,
  favorite_color TEXT,
  favorite_artist TEXT,
  hobbies TEXT[] DEFAULT '{}',
  motivational_quote TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read all profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT
  USING (true);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create policy to allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create a function to automatically update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

4. Click **"Run"** (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned" - that's good!

## Step 5: Enable Email Auth (Optional but Recommended)

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Make sure **"Email"** is enabled
3. Optionally configure email templates if you want custom emails

## Step 6: Test It!

1. Restart your development server (if running locally)
2. If using Lovable, it should pick up the environment variables automatically
3. Try signing up/signing in on your app
4. Navigate to the Profile page - it should work now!

## Troubleshooting

- **"Table not found" error**: Make sure you ran the SQL migration (Step 4)
- **"Invalid API key"**: Double-check you're using the `anon` `public` key, not `service_role`
- **Environment variables not working**: In Lovable, make sure you've saved them and restarted/previewed your app

