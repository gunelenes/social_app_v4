import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "./firebaseConfig";

export type PostType = "image" | "note";

/* ---------------- UPLOAD IMAGE TO STORAGE ---------------- */
export const uploadImage = async (file: File): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  // Create a unique filename
  const timestamp = Date.now();
  const filename = `${timestamp}_${file.name}`;
  
  // Create reference: userId/filename
  const storageRef = ref(storage, `${user.uid}/${filename}`);
  
  // Upload file
  await uploadBytes(storageRef, file);
  
  // Get download URL
  const downloadURL = await getDownloadURL(storageRef);
  
  return downloadURL;
};

/* ---------------- CREATE POST ---------------- */
export const createPost = async (params: {
  type: PostType;
  text?: string;
  image_url?: string;
  imageFile?: File; // Yeni parametre
}) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const username = user.email?.split("@")[0] ?? "unknown";

  // Eğer resim dosyası varsa, önce yükle
  let imageUrl = params.image_url ?? "";
  if (params.imageFile) {
    imageUrl = await uploadImage(params.imageFile);
  }

  await addDoc(collection(db, "posts"), {
    user_id: user.uid,
    username,
    type: params.type,
    text: params.text ?? "",
    image_url: imageUrl,
    created_date: serverTimestamp(),
    is_active: true,
  });
};

/* ---------------- HOME FEED ---------------- */
export const getHomeFeedPosts = async () => {
  const q = query(
    collection(db, "posts"),
    where("is_active", "==", true),
    orderBy("created_date", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

/* ---------------- PROFILE POSTS ---------------- */
export const getMyActivePosts = async () => {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(
    collection(db, "posts"),
    where("is_active", "==", true),
    where("user_id", "==", user.uid),
    orderBy("created_date", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};