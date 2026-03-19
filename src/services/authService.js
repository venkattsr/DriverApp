import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";

export const registerDriver = async (name, phone, password) => {
  const fakeEmail = `${phone}@driverapp.local`;
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    fakeEmail,
    password,
  );
  const user = userCredential.user;

  await updateProfile(user, { displayName: name });

  await setDoc(doc(db, "drivers", user.uid), {
    uid: user.uid,
    name,
    phone,
    email: "",
    profileComplete: false,
    isAvailable: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    licensePhotoFront: "",
    licensePhotoBack: "",
    aadhaarFront: "",
    aadhaarBack: "",
    vehicleTypes: [],
    contactAddress: "",
    totalEarnings: 0,
    totalTrips: 0,
    totalKms: 0,
  });

  return user;
};

export const loginDriver = async (phone, password) => {
  const fakeEmail = `${phone}@driverapp.local`;
  const userCredential = await signInWithEmailAndPassword(
    auth,
    fakeEmail,
    password,
  );
  return userCredential.user;
};

export const logoutDriver = async () => {
  await signOut(auth);
};

export const getDriverProfile = async (uid) => {
  const docRef = doc(db, "drivers", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
};

export const updateDriverProfile = async (uid, data) => {
  const docRef = doc(db, "drivers", uid);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const markProfileComplete = async (uid) => {
  const docRef = doc(db, "drivers", uid);
  await updateDoc(docRef, {
    profileComplete: true,
    updatedAt: serverTimestamp(),
  });
};

export const toggleAvailability = async (uid, isAvailable) => {
  const docRef = doc(db, "drivers", uid);
  await updateDoc(docRef, {
    isAvailable,
    updatedAt: serverTimestamp(),
  });
};
