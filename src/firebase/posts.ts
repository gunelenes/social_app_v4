import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "./firebaseConfig";

export type PostType = "image" | "note";

/* =========================================================
   IMAGE UPLOAD (STORAGE)
========================================================= */
export const uploadImage = async (file: File): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const timestamp = Date.now();
  const filename = `${timestamp}_${file.name}`;

  // 📦 Storage path
  const storageRef = ref(storage, `${user.uid}/${filename}`);

  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

/* =========================================================
   CREATE POST
========================================================= */
export const createPost = async (params: {
  type: PostType;
  text?: string;
  image_url?: string;
  imageFile?: File;
}) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const username = user.email?.split("@")[0] ?? "unknown";

  let imageUrl = params.image_url ?? "";

  // 📸 Eğer imageFile varsa önce upload et
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

/* =========================================================
   HOME FEED – REAL-TIME
========================================================= */
export const subscribeHomeFeedPosts = (
  callback: (posts: any[]) => void
) => {
  const q = query(
    collection(db, "posts"),
    where("is_active", "==", true),
    orderBy("created_date", "desc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    callback(posts);
  });

  return unsubscribe; // 🧹 cleanup
};

/* =========================================================
   PROFILE FEED – REAL-TIME (MY POSTS)
========================================================= */
export const subscribeMyProfilePosts = (
  callback: (posts: any[]) => void
) => {
  const user = auth.currentUser;
  if (!user) return () => {};

  const q = query(
    collection(db, "posts"),
    where("is_active", "==", true),
    where("user_id", "==", user.uid),
    orderBy("created_date", "desc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    callback(posts);
  });

  return unsubscribe;
};

/* =========================================================
   PROFILE POSTS – STATIC (OPSİYONEL / DEBUG)
========================================================= */
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
