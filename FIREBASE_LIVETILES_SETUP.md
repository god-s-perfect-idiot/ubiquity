# Firebase Live Tiles Setup Guide

This guide will help you set up Firebase Firestore security rules for the live tiles functionality.

## Firestore Security Rules

Since the app uses localStorage-based user IDs (not Firebase Authentication), you'll need to add permissive rules for the `livetiles` collection.

### Development Rules (Permissive)

Add these rules to your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Marketplace rules (existing)
    match /marketplace/{document} {
      allow read, write: if true;
    }
    
    // Live Tiles rules
    match /livetiles/{document} {
      allow read, write: if true;
    }
  }
}
```

### Production Rules (More Restrictive)

For production, you can use more restrictive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Marketplace rules
    match /marketplace/{document} {
      allow read: if resource.data.isPublic == true;
      allow write: if request.auth != null && request.auth.uid == resource.data.ownerId;
      allow create: if request.auth != null;
    }
    
    // Live Tiles rules
    match /livetiles/{document} {
      // Allow reading public tiles
      allow read: if resource.data.isPublic == true || resource.data.isPublic == null;
      
      // Allow creating new tiles (anyone can publish)
      allow create: if true;
      
      // Allow updating/deleting only by owner
      allow update, delete: if request.resource.data.ownerId == resource.data.ownerId;
    }
  }
}
```

## How to Update Firestore Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to "Firestore Database" → "Rules" tab
4. Update the rules to include the `livetiles` collection
5. Click "Publish" to save the rules

## Live Tiles Data Structure

The livetiles collection stores tiles with the following structure:

```javascript
{
  appUrl: 'string', // URL of the app this tile is for
  appName: 'string', // Name of the app
  tile4x2: 'string', // HTML for 4x2 tile
  tile2x2: 'string', // HTML for 2x2 tile
  autoTileFlip: 'boolean', // Whether auto flip is enabled
  owner: 'string', // User who published it
  ownerId: 'string', // User ID (from localStorage)
  description: 'string', // Optional description
  downloads: 0, // Download/use count
  rating: 0, // Average rating
  ratingCount: 0, // Number of ratings
  isPublic: true, // Whether tile is publicly visible
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Troubleshooting

### Permission Denied Error

If you get a `PERMISSION_DENIED` error when publishing:

1. **Check Firestore Rules**: Make sure you've added rules for the `livetiles` collection
2. **Verify Rule Syntax**: Ensure your rules are valid and published
3. **Check Collection Name**: The collection must be named exactly `livetiles` (lowercase)

### Getting Help

- Check the [Firebase Documentation](https://firebase.google.com/docs)
- Review the [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)

