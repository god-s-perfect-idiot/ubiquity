import { initializeApp } from 'firebase/app';
import {
	getFirestore,
	collection,
	getDocs,
	addDoc,
	updateDoc,
	doc,
	serverTimestamp
} from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
	apiKey: process.env.VITE_FIREBASE_API_KEY,
	authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.VITE_FIREBASE_APP_ID,
	measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

export const MARKETPLACE_COLLECTION = 'marketplace';

let db = null;

export function ensureFirebaseConfig() {
	if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
		console.error('Firebase configuration is missing.');
		console.error('Ensure all VITE_FIREBASE_* variables are set in your .env file.');
		process.exit(1);
	}
}

export function getDb() {
	if (!db) {
		ensureFirebaseConfig();
		const app = initializeApp(firebaseConfig);
		db = getFirestore(app);
	}
	return db;
}

export { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp };
