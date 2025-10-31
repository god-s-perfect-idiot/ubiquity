#!/usr/bin/env node

/**
 * Seed script to populate Firebase Firestore with marketplace items from sources.js
 * 
 * Usage: node seed-marketplace.js
 * 
 * Make sure you have:
 * 1. A .env file with Firebase configuration
 * 2. Firebase admin SDK or use the web SDK with service account
 * 3. Run: npm install dotenv
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, updateDoc, doc, getDocs } from 'firebase/firestore';
import fs from 'fs';
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

// Import sources from sources.js
async function parseSourcesFile() {
	const sourcesPath = path.join(__dirname, 'src', 'routes', 'marketplace', 'sources.js');
	
	// Use dynamic import to load the ES module
	// Convert file:// URL to work with import()
	const fileUrl = pathToFileURL(sourcesPath).href;
	
	try {
		const module = await import(fileUrl);
		return module.sources || {};
	} catch (error) {
		console.error('Error importing sources file:', error);
		// Fallback: try reading and parsing as JSON-like structure
		const fileContent = fs.readFileSync(sourcesPath, 'utf-8');
		const match = fileContent.match(/export const sources = ({[\s\S]+});/);
		if (match) {
			return JSON.parse(match[1]);
		}
		throw new Error('Could not parse sources file');
	}
}

// Mapping from plural category names to singular marketplace types
const typeMapping = {
	'apps': 'app',
	'music': 'music',
	'videos': 'video',
	'documents': 'document',
	'photos': 'image'
};

// Seed the marketplace database
async function seedMarketplace() {
	console.log('🌱 Starting marketplace seeding...\n');

	try {
		// Parse sources
		const sources = await parseSourcesFile();
		
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

		console.log(`Found ${allItems.length} items to seed\n`);

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

		console.log('\n✨ Seeding completed!');
		console.log(`   Added: ${addedCount} items`);
		console.log(`   Updated: ${updatedCount} items`);
		console.log(`   Total: ${allItems.length} items\n`);

	} catch (error) {
		console.error('❌ Error seeding marketplace:', error);
		process.exit(1);
	}
}

// Check if Firebase is configured
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
	console.error('❌ Firebase configuration is missing!');
	console.error('   Please check your .env file and ensure all VITE_FIREBASE_* variables are set.\n');
	process.exit(1);
}

// Run the seeding
seedMarketplace()
	.then(() => {
		console.log('🎉 Done!\n');
		process.exit(0);
	})
	.catch((error) => {
		console.error('❌ Fatal error:', error);
		process.exit(1);
	});

