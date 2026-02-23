import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.FB_API_KEY,
  authDomain: process.env.FB_AUTHDOMAIN,
  projectId: process.env.FB_PROJECT_ID,
  storageBucket: process.env.FB_STORAGE_BUCKET,
  messagingSenderId: process.env.FB_MESSAGING_SENDER_ID,
  appId: process.env.FB_APP_ID
};

// Singleton pattern to prevent re-initialization during Next.js HMR
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const storage: FirebaseStorage = getStorage(app);

export { storage };