import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBzDdw9aA-MuIl5brjWcq3LmH3aj-LIVKU",
  authDomain: "biharseva-35cbd.firebaseapp.com",
  projectId: "biharseva-35cbd",
  storageBucket: "biharseva-35cbd.appspot.com",
  messagingSenderId: "344805746989",
  appId: "YOUR_APP_ID_HERE" // You'll get this from Firebase Console -> Project Settings -> Your apps
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

