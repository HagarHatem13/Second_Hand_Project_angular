import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBJQjHELQ138-GdFpTMRrCCoFLjpe96Zug",
  authDomain: "hciproject-f97b7.firebaseapp.com",
  projectId: "hciproject-f97b7",
  storageBucket: "hciproject-f97b7.firebasestorage.app",
  messagingSenderId: "401368899104",
  appId: "1:401368899104:web:210554261e687cf5b52645",
  measurementId: "G-HEPJ9LR7GT"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
