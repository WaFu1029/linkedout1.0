# Setting Environment Variables in Lovable

## Method 1: Using Lovable's Environment Variables UI (Recommended)

1. **In your Lovable project**, look for one of these:
   - A **gear icon** ⚙️ or **Settings** button (usually top right or in a sidebar)
   - A **"Project Settings"** or **"Settings"** menu item
   - Click on your project name/avatar to open a dropdown with settings

2. Look for:
   - **"Environment Variables"**
   - **"Secrets"**
   - **"Env"** or **".env"**
   - **"Configuration"**
   - **"Variables"**

3. Once you find it, you'll see a list or form where you can add variables. Click **"Add Variable"** or **"New Variable"**

4. Add these TWO variables one at a time:

   **Variable 1:**
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: Your Supabase project URL (e.g., `https://xxxxxxxxxxxxx.supabase.co`)

   **Variable 2:**
   - **Name**: `VITE_SUPABASE_PUBLISHABLE_KEY`
   - **Value**: Your Supabase anon/public API key (starts with `eyJhbG...`)

5. **Save** the variables

6. **Restart your preview/development server** if there's a button for that, or just refresh your preview

## Method 2: Create a .env file (If you have file access)

If Lovable lets you create files directly:

1. In the file explorer, create a new file called `.env` in the root directory (same level as `package.json`)

2. Add these lines (replace with your actual values):

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-key-here
```

3. Save the file

## Still Can't Find It?

If you can't find environment variables in Lovable:
1. Look at the top navigation bar - sometimes there's a settings icon there
2. Check if there's a left sidebar with project navigation
3. Look for any "Configure" or "Setup" buttons
4. Check the bottom of the screen for any configuration panels

## Need Help Finding Your Supabase Values?

**To get your Supabase URL and Key:**
1. Go to https://supabase.com/dashboard
2. Click on your project
3. Click **Settings** (gear icon) → **API**
4. Copy:
   - **Project URL** (for VITE_SUPABASE_URL)
   - **anon public** key (for VITE_SUPABASE_PUBLISHABLE_KEY) - it's the one that starts with `eyJ`






