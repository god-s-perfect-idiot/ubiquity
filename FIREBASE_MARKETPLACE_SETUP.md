# Firebase Marketplace Setup Guide

This guide will help you set up Firebase Firestore for the marketplace functionality in your Ubiquity app.

## Prerequisites

- A Firebase account (free tier available)
- Node.js and npm installed
- Your Ubiquity project set up

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select an existing project
3. Follow the setup wizard:
   - Enter a project name
   - Enable/disable Google Analytics (optional)
   - Choose a location for your project

## Step 2: Set up Firestore Database

1. In your Firebase project, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" for development
4. Select a location for your database (choose one close to your users)

## Step 3: Configure Firebase for Web

1. In your Firebase project, go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" and select the Web icon (`</>`)
4. Register your app with a nickname (e.g., "Ubiquity Marketplace")
5. Copy the Firebase configuration object

## Step 4: Update Firebase Configuration

1. Copy `firebase-config-example.js` to `src/lib/firebase-config.js`
2. Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id"
};
```

## Step 5: Set up Firestore Security Rules

For development, you can use these permissive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /marketplace/{document} {
      allow read, write: if true;
    }
  }
}
```

For production, use more restrictive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /marketplace/{document} {
      allow read: if resource.data.isPublic == true;
      allow write: if request.auth != null && request.auth.uid == resource.data.ownerId;
      allow create: if request.auth != null;
    }
  }
}
```

## Step 6: Test the Setup

1. Start your development server: `npm run dev`
2. Navigate to the marketplace section
3. Try publishing an item using the "Publish" button
4. Check your Firestore console to see if the item was created

## Marketplace Data Structure

The marketplace collection stores items with the following structure:

```javascript
{
  type: 'app' | 'music' | 'image' | 'video' | 'document',
  name: 'Item Name',
  description: 'Item description',
  owner: 'Owner Name',
  ownerId: 'owner-user-id',
  source: 'URL or file path',
  icon: 'icon-url',
  background: '#color-code',
  category: 'category-name',
  tags: ['tag1', 'tag2'],
  downloads: 0,
  rating: 0,
  ratingCount: 0,
  isPublic: true,
  isFeatured: false,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## API Endpoints

The following API endpoints are available:

- `GET /api/marketplace` - Get marketplace items with optional filters
- `POST /api/marketplace` - Add a new marketplace item
- `GET /api/marketplace/[id]` - Get a specific marketplace item
- `PUT /api/marketplace/[id]` - Update a marketplace item
- `DELETE /api/marketplace/[id]` - Delete a marketplace item
- `POST /api/marketplace/[id]/download` - Increment download count
- `POST /api/marketplace/[id]/rate` - Rate a marketplace item

## Troubleshooting

### Common Issues:

1. **Firebase not initialized**: Make sure your Firebase config is correct and the file is properly imported
2. **Permission denied**: Check your Firestore security rules
3. **Network errors**: Ensure your Firebase project is active and billing is set up if needed

### Getting Help:

- Check the [Firebase Documentation](https://firebase.google.com/docs)
- Review the [Firestore Documentation](https://firebase.google.com/docs/firestore)
- Check the browser console for error messages

## Next Steps

Once the basic setup is working:

1. Implement user authentication for better ownership tracking
2. Add file upload functionality for icons and media
3. Implement search and filtering features
4. Add user profiles and collections
5. Set up proper production security rules
