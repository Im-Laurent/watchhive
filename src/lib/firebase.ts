import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyDWxqVTBIYs8DRC54FZwdn_HnFBKws_WLY',
  authDomain: 'watchhive-8d6bd.firebaseapp.com',
  projectId: 'watchhive-8d6bd',
  storageBucket: 'watchhive-8d6bd.firebasestorage.app',
  messagingSenderId: '999048585965',
  appId: '1:999048585965:web:de988d5cbe220d34de22e4',
  measurementId: 'G-SQTETTW0DQ',
};

export const firebaseApp: FirebaseApp = initializeApp(firebaseConfig);

let analyticsInstance: Analytics | null = null;
let analyticsPromise: Promise<Analytics | null> | null = null;

export function getAnalyticsAsync(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (analyticsInstance) return Promise.resolve(analyticsInstance);
  if (analyticsPromise) return analyticsPromise;
  analyticsPromise = isSupported()
    .then((supported) => {
      if (!supported) return null;
      analyticsInstance = getAnalytics(firebaseApp);
      return analyticsInstance;
    })
    .catch(() => null);
  return analyticsPromise;
}
