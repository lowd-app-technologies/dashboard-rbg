import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin
const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    console.log('Initializing Firebase Admin...');
    
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.error('FIREBASE_SERVICE_ACCOUNT not found in environment variables');
      throw new Error('FIREBASE_SERVICE_ACCOUNT must be set');
    }

    try {
      // Parse the JSON string from environment variable
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      console.log('Initializing with service account:', {
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email
      });

      initializeApp({
        credential: cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
        storageBucket: `${serviceAccount.project_id}.appspot.com`
      });

      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Error parsing service account:', error);
      throw error;
    }
  }
};

// Initialize Firebase Admin
try {
  initializeFirebaseAdmin();
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
  throw error;
}

// Export Firebase Admin instances
export const auth = getAuth();
export const firestore = getFirestore();
export const storage = getStorage();

// User management functions
export const verifyToken = async (token: string) => {
  try {
    console.log('Verifying token...');
    const decodedToken = await auth.verifyIdToken(token);
    console.log('Token verified successfully:', {
      uid: decodedToken.uid,
      email: decodedToken.email
    });
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    throw new Error('Invalid token');
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
