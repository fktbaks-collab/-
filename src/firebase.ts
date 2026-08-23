import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, Firestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth, Auth, signInAnonymously } from 'firebase/auth';
import config from '../firebase-applet-config.json';

// Initialize Firebase App instance
const app = getApps().length === 0 ? initializeApp(config) : getApp();

// Initialize Firestore with auto-detect long polling for reliable iframe/proxy connectivity
export const db: Firestore = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  },
  config.firestoreDatabaseId || '(default)'
);

export const auth: Auth = getAuth(app);

// Helper to ensure anonymous auth session for real-time multiplayer
export async function ensureAuthUser(): Promise<string> {
  if (auth.currentUser) {
    return auth.currentUser.uid;
  }
  try {
    const cred = await signInAnonymously(auth);
    return cred.user.uid;
  } catch (err) {
    console.warn('Firebase Auth warning, using fallback local UID:', err);
    let localUid = localStorage.getItem('football_quiz_fallback_uid');
    if (!localUid) {
      localUid = 'user_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('football_quiz_fallback_uid', localUid);
    }
    return localUid;
  }
}

