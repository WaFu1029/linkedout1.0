# Fix Supabase Email Confirmation Redirect

## The Problem
When you click the email confirmation link, it tries to redirect to `localhost` which isn't running. We need to tell Supabase where to redirect users after they confirm their email.

## Solution: Configure Redirect URLs in Supabase

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Go to Authentication** (left sidebar) → **URL Configuration**
4. **Find "Redirect URLs"** section
5. **Add these URLs** (click "Add URL" for each):

   For development (if running locally):
   ```
   http://localhost:5173
   http://localhost:5173/**
   ```

   For Lovable preview (get your actual preview URL):
   ```
   https://your-lovable-preview-url.lovable.app
   https://your-lovable-preview-url.lovable.app/**
   ```

   **Important**: Replace `your-lovable-preview-url` with your actual Lovable preview URL!

6. **Also check "Site URL"** at the top - set it to:
   - Your Lovable preview URL, OR
   - `http://localhost:5173` if running locally

7. **Save** the changes

## Alternative: Disable Email Confirmation (For Testing)

If you just want to test quickly without email confirmation:

1. In Supabase Dashboard → **Authentication** → **Providers**
2. Click on **"Email"**
3. **Uncheck** "Confirm email" (or set it to disabled)
4. **Save**

Now users can sign in immediately without confirming their email.

## After Setting Up Redirects

1. Try signing up again
2. Click the confirmation link in your email
3. It should redirect to your app (not localhost)
4. Then you can sign in!






