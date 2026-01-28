# Setup Guide

This guide will help you set up the Hotel Management System project.

## Step 1: Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter a project name (e.g., "hotel-management-system")
4. Follow the setup wizard (you can disable Google Analytics if not needed)

## Step 2: Enable Firebase Services

### Enable Authentication

1. In Firebase Console, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Google" as a sign-in provider
5. Add your support email
6. Save

### Enable Firestore Database

1. In Firebase Console, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in production mode" (we'll deploy security rules later)
4. Select a location closest to your users
5. Click "Enable"

### Enable Storage

1. In Firebase Console, go to "Storage" in the left sidebar
2. Click "Get started"
3. Choose "Start in production mode"
4. Use the same location as Firestore
5. Click "Done"

## Step 3: Get Firebase Configuration

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click the web icon (</>) to add a web app
4. Register your app with a nickname (e.g., "Hotel Management Web")
5. Copy the Firebase configuration object

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Open `.env` and fill in your Firebase configuration values:
   ```
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

## Step 5: Install Firebase CLI (Optional but Recommended)

1. Install Firebase CLI globally:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init
   ```
   - Select: Firestore, Hosting, Storage
   - Use existing project
   - Accept default file names
   - Configure as single-page app: Yes
   - Set up automatic builds: No

## Step 6: Deploy Security Rules

Deploy Firestore security rules:
```bash
firebase deploy --only firestore:rules
```

Deploy Firestore indexes:
```bash
firebase deploy --only firestore:indexes
```

Deploy Storage security rules:
```bash
firebase deploy --only storage
```

## Step 7: Create First Super Admin User

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the app in your browser (usually http://localhost:5173)

3. Sign in with Google

4. After signing in, go to Firebase Console > Firestore Database

5. Find your user document in the `users` collection

6. Edit the document and change the `role` field from `"regular"` to `"super_admin"`

7. Refresh the app - you should now have super admin access

## Step 8: Verify Setup

1. Check that you can sign in with Google
2. Check that you can access the dashboard
3. Check that Firebase security rules are working (try accessing data without authentication)

## Troubleshooting

### Build Errors

If you encounter TypeScript errors, make sure all dependencies are installed:
```bash
npm install
```

### Firebase Connection Issues

- Verify your `.env` file has the correct Firebase configuration
- Check that all Firebase services are enabled in the console
- Make sure security rules are deployed

### Authentication Issues

- Verify Google Sign-In is enabled in Firebase Console
- Check that your domain is authorized in Firebase Console > Authentication > Settings > Authorized domains
- For local development, `localhost` should be automatically authorized

## Next Steps

After setup is complete, you can:
1. Start implementing features according to the tasks.md file
2. Create additional user accounts
3. Add hotels and configure settings
4. Begin testing the application

For development workflow, see the main README.md file.
