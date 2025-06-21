// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getFirestore} from "firebase/firestore"
const firebaseConfig = {
  apiKey: "AIzaSyAOfhyTu8lY-dqsYfWhPyehHY2PPO62fus",
  authDomain: "mytrip-938af.firebaseapp.com",
  projectId: "mytrip-938af",
  storageBucket: "mytrip-938af.firebasestorage.app",
  messagingSenderId: "584906147500",
  appId: "1:584906147500:web:1aca00bff2953510a0c109",
  measurementId: "G-54BY19VSS4"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);