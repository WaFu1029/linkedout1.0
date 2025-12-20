# Supabase Setup Instructions

## Database Migration

To set up the profiles table, run the migration SQL file in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the contents of `supabase/migrations/20240101000000_create_profiles_table.sql`

This will create:
- A `profiles` table with user profile information
- Row Level Security (RLS) policies to allow users to view all profiles but only edit their own
- An automatic `updated_at` timestamp trigger

## Environment Variables

Make sure you have these environment variables set in your `.env` file:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

## Features Implemented

- ✅ User authentication (sign up / sign in)
- ✅ User profiles with editable fields (industry, hobbies, favorites, motivational quote)
- ✅ Profile page matching the project's neo-brutalist design style
- ✅ Conditional navbar that shows/hides Sign In/Join Us based on auth state
- ✅ Sign out functionality

## Next Steps

After running the migration, users will be able to:
1. Sign up for accounts
2. Sign in to existing accounts
3. View and edit their profiles
4. See the Profile link in the navbar when logged in






