import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { User } from "firebase/auth";

export const createUserIfNotExists = async (
  user: User,
  faculty: string
) => {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: serverTimestamp(),
      username: user.email?.split("@")[0],
      faculty, // 👈 BURASI
    });
  }
};

export const updateUserProfile = async (
  uid: string,
  data: {
    bio?: string;
    photo_url?: string;
    faculty?: string;
  }
) => {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, data);
};
