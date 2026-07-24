import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';

// Import applet config
import firebaseConfig from '../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Auth helper functions
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
  todayCount: number;
  totalCount: number;
  lastActiveDate: string;
  updatedAt?: any;
}

export interface UserLog {
  id?: string;
  userId: string;
  displayName?: string;
  photoURL?: string | null;
  date: string;
  count: number;
  target?: number;
  updatedAt?: any;
}

// Sync user profile & today's count to Firestore
export const syncUserDataToFirestore = async (
  user: User,
  todayCount: number,
  totalCount: number,
  todayDate: string
) => {
  if (!user) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    
    const profileData: Partial<UserProfile> = {
      uid: user.uid,
      displayName: user.displayName || 'Anonymous Reciter',
      email: user.email,
      photoURL: user.photoURL,
      todayCount,
      totalCount,
      lastActiveDate: todayDate,
      updatedAt: serverTimestamp()
    };

    await setDoc(userRef, profileData, { merge: true });

    // Also update log entry for today
    const logRef = doc(db, 'userLogs', `${user.uid}_${todayDate}`);
    await setDoc(logRef, {
      userId: user.uid,
      displayName: user.displayName || 'Anonymous Reciter',
      photoURL: user.photoURL,
      date: todayDate,
      count: todayCount,
      updatedAt: serverTimestamp()
    }, { merge: true });

  } catch (e) {
    console.error('Failed to sync data to Firestore:', e);
  }
};

// Listen to community users
export const subscribeToCommunityUsers = (callback: (users: UserProfile[]) => void) => {
  try {
    const usersQuery = query(collection(db, 'users'), orderBy('totalCount', 'desc'), limit(50));
    return onSnapshot(usersQuery, (snapshot) => {
      const users: UserProfile[] = [];
      snapshot.forEach((doc) => {
        users.push(doc.data() as UserProfile);
      });
      callback(users);
    }, (error) => {
      console.error('Error fetching community users:', error);
      callback([]);
    });
  } catch (e) {
    console.error('Error setting up listener:', e);
    return () => {};
  }
};

export { onAuthStateChanged };
export type { User };
