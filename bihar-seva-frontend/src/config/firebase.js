import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCj5iXeh6You6K24TCZ8eGb3ct2iMV7JVU",
  authDomain: "biharseva-35cbd.firebaseapp.com",
  projectId: "biharseva-35cbd",
  storageBucket: "biharseva-35cbd.firebasestorage.app",
  messagingSenderId: "344805746989",
  appId: "1:344805746989:android:46c326964e08620b520ba4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

