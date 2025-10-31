#!/usr/bin/env node

/**
 * Update script to add or update marketplace items from resource-updater.js to Firebase Firestore
 * 
 * Usage: node update-marketplace.js
 * 
 * This script will add new items or update existing items from resource-updater.js.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, updateDoc, doc, getDocs } from 'firebase/firestore';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// Mapping from plural category names to singular marketplace types
const typeMapping = {
	'apps': 'app',
	'music': 'music',
	'videos': 'video',
	'documents': 'document',
	'photos': 'image'
};

// Import sources from resource-updater.js
async function parseResourceUpdater() {
	const updaterPath = path.join(__dirname, 'src', 'routes', 'marketplace', 'resource-updater.js');
	
	// Use dynamic import to load the ES module
	const fileUrl = pathToFileURL(updaterPath).href;
	
	try {
		const module = await import(fileUrl);
		return module.sources || {};
	} catch (error) {
		console.error('Error importing resource-updater file:', error);
		throw new Error('Could not parse resource-updater file');
	}
}

// Update the marketplace database
async function updateMarketplace() {
	console.log('🔄 Starting marketplace update...\n');

	try {
		// Parse resource-updater
		const sources = await parseResourceUpdater();
		
		// Get all items from all categories
		const allItems = [];
		for (const [category, items] of Object.entries(sources)) {
			const marketplaceType = typeMapping[category] || category.slice(0, -1);
			items.forEach(item => {
				allItems.push({
					...item,
					marketplaceType
				});
			});
		}

		console.log(`Found ${allItems.length} items in resource-updater\n`);

		// Check for existing items to track updates vs additions
		const existingItemsSnapshot = await getDocs(collection(db, 'marketplace'));
		const existingItemsMap = new Map();
		existingItemsSnapshot.docs.forEach(docSnapshot => {
			const data = docSnapshot.data();
			existingItemsMap.set(data.source, { id: docSnapshot.id, data });
		});

		let addedCount = 0;
		let updatedCount = 0;

		for (const item of allItems) {
			// Check if item already exists
			const existingItem = existingItemsMap.get(item.source);

			// Prepare item data matching the marketplace schema
			const itemData = {
				type: item.marketplaceType,
				name: item.name,
				description: item.description,
				owner: item.owner,
				ownerId: 'system', // System-generated items
				source: item.source,
				icon: item.icon,
				background: item.background,
				category: item.category || 'general',
				tags: item.tags || [item.name.toLowerCase()],
				updatedAt: new Date()
			};

			if (existingItem) {
				// Update existing item
				await updateDoc(doc(db, 'marketplace', existingItem.id), itemData);
				console.log(`🔄 Updated ${item.name} (${item.marketplaceType})`);
				updatedCount++;
			} else {
				// Add new item with full schema
				const newItemData = {
					...itemData,
					downloads: 0,
					rating: 0,
					ratingCount: 0,
					version: '1.0.0',
					isPublic: true,
					isFeatured: false,
					createdAt: new Date()
				};
				const docRef = await addDoc(collection(db, 'marketplace'), newItemData);
				console.log(`✅ Added ${item.name} (${item.marketplaceType}) with ID: ${docRef.id}`);
				addedCount++;
			}
		}

		console.log('\n✨ Update completed!');
		console.log(`   Added: ${addedCount} items`);
		console.log(`   Updated: ${updatedCount} items`);
		console.log(`   Total: ${allItems.length} items`);
		console.log('');

	} catch (error) {
		console.error('❌ Error updating marketplace:', error);
		process.exit(1);
	}
}

// Check if Firebase is configured
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
	console.error('❌ Firebase configuration is missing!');
	console.error('   Please check your .env file and ensure all VITE_FIREBASE_* variables are set.\n');
	process.exit(1);
}

// Run the update
updateMarketplace()
	.then(() => {
		console.log('🎉 Done!\n');
		process.exit(0);
	})
	.catch((error) => {
		console.error('❌ Fatal error:', error);
		process.exit(1);
	});

