#!/usr/bin/env node

/**
 * Reset script to delete all marketplace items from Firebase Firestore
 *
 * Usage: node reset-marketplace.js
 *
 * WARNING: This will permanently delete all items in the marketplace collection!
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch } from 'firebase/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Firebase configuration from environment variables
const firebaseConfig = {
	apiKey: process.env.VITE_FIREBASE_API_KEY,
	authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.VITE_FIREBASE_APP_ID,
	measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Reset the marketplace database
async function resetMarketplace() {
	console.log('🗑️  Starting marketplace reset...\n');

	try {
		// Get all items in the marketplace collection
		const itemsSnapshot = await getDocs(collection(db, 'marketplace'));
		const itemCount = itemsSnapshot.size;

		console.log(`Found ${itemCount} items to delete\n`);

		if (itemCount === 0) {
			console.log('✨ No items to delete. Marketplace is already empty.\n');
			return;
		}

		// Batch delete all items (Firebase limit is 500 operations per batch)
		const BATCH_SIZE = 500;
		let deletedCount = 0;
		let batchCount = 0;

		for (let i = 0; i < itemsSnapshot.docs.length; i += BATCH_SIZE) {
			const batch = writeBatch(db);
			const batchDocs = itemsSnapshot.docs.slice(i, i + BATCH_SIZE);

			for (const itemDoc of batchDocs) {
				batch.delete(itemDoc.ref);
			}

			await batch.commit();
			batchCount++;
			deletedCount += batchDocs.length;
			console.log(`✅ Deleted batch ${batchCount} (${batchDocs.length} items)`);
		}

		console.log('\n✨ Reset completed!');
		console.log(`   Deleted: ${deletedCount} items in ${batchCount} batch(es)\n`);
	} catch (error) {
		console.error('❌ Error resetting marketplace:', error);
		process.exit(1);
	}
}

// Check if Firebase is configured
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
	console.error('❌ Firebase configuration is missing!');
	console.error(
		'   Please check your .env file and ensure all VITE_FIREBASE_* variables are set.\n'
	);
	process.exit(1);
}

// Run the reset
resetMarketplace()
	.then(() => {
		console.log('🎉 Done!\n');
		process.exit(0);
	})
	.catch((error) => {
		console.error('❌ Fatal error:', error);
		process.exit(1);
	});
