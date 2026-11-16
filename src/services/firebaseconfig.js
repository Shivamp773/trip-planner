import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

// Firebase web config is public by design (it ships to every browser);
// access to the data is controlled by Firestore security rules.
const firebaseConfig = {
  apiKey: 'AIzaSyAOfhyTu8lY-dqsYfWhPyehHY2PPO62fus',
  authDomain: 'mytrip-938af.firebaseapp.com',
  projectId: 'mytrip-938af',
  storageBucket: 'mytrip-938af.firebasestorage.app',
  messagingSenderId: '584906147500',
  appId: '1:584906147500:web:1aca00bff2953510a0c109',
  measurementId: 'G-54BY19VSS4',
};

export const app = initializeApp(firebaseConfig);

// ignoreUndefinedProperties: an optional field missing from the AI response never breaks a save.
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
