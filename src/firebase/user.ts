import { doc, getDoc, setDoc, serverTimestamp,updateDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { User } from "firebase/auth";

export const createUserIfNotExists = async (user: User) => {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: serverTimestamp(),
      username: user.email?.split("@")[0], // geçici username
    });
  }
};

export const updateUserProfile = async (
  uid: string,
  data: {
    bio?: string;
    photo_url?: string;
  }
) => {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, data);
};