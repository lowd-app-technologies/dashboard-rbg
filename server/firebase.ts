import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    // Use either service account JSON or environment variables
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Parse the JSON string from environment variable
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({
        credential: cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
      });
    } else {
      // If running on Firebase hosting or using Application Default Credentials
      initializeApp();
    }
  }
};

// Initialize Firebase Admin
initializeFirebaseAdmin();

// Export Firebase Admin instances
export const auth = getAuth();
export const firestore = getFirestore();

// User management functions
export const verifyToken = async (token: string) => {
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    throw error;
  }
};

export const getUserByUid = async (uid: string) => {
  try {
    const userRecord = await auth.getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Error fetching user by UID:', error);
    throw error;
  }
};

export const getUserData = async (uid: string) => {
  try {
    const userDoc = await firestore.collection('users').doc(uid).get();
    if (userDoc.exists) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

export const updateUserData = async (uid: string, data: any) => {
  try {
    await firestore.collection('users').doc(uid).update(data);
    return true;
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
};
