import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

export const getActivePosts = async () => {
  const q = query(
    collection(db, "posts"),
    where("is_active", "==", true),
    orderBy("created_date", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
