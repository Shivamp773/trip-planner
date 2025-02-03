
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getFirestore} from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCKbR4qwKYe57pA8zh01RPiXmisFomkqfA",
  authDomain: "trip-planer-80628.firebaseapp.com",
  projectId: "trip-planer-80628",
  storageBucket: "trip-planer-80628.firebasestorage.app",
  messagingSenderId: "928922423372",
  appId: "1:928922423372:web:62bce3dc54a97a9fca64e9",
  measurementId: "G-Q3XPCKPHMB"
};


export const app = initializeApp(firebaseConfig);
//export const analytics = getAnalytics(app);
export const db = getFirestore(app);