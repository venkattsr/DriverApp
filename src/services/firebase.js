import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDYR667b7MKFIyysXE4FkccYfL0cGh17RA",
  authDomain: "driverappv.firebaseapp.com",
  projectId: "driverappv",
  storageBucket: "driverappv.firebasestorage.app",
  messagingSenderId: "400538050452",
  appId: "1:400538050452:web:cea8e0cdfb34877b7cb981",
};

import { Platform } from "react-native";

let app, auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  if (Platform.OS === "web") {
    auth = getAuth(app);
  } else {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
} else {
  app = getApp();
  auth = getAuth(app);
}

const db = getFirestore(app);

export { auth, db };
export default app;
