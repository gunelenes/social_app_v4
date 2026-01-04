import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  deleteDoc,
  doc,
  getDoc, // Kullanıcı verisini çekmek için eklendi
  updateDoc,
  increment,
} from "firebase/firestore";
import { db, auth } from "./firebaseConfig";

/* ========== CREATE COMMENT ========== */

export const createComment = async (
  postId: string,
  text: string
) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  // 1. Kullanıcının güncel profil bilgilerini Firestore'dan çekiyoruz
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.exists() ? userSnap.data() : null;

  const username = userData?.username ?? user.email?.split("@")[0] ?? "unknown";
  const profile_photo_url = userData?.photo_url ?? ""; // Profil fotoğrafı bilgisini aldık

  // 2. Yorumu profil fotoğrafı URL'si ile birlikte kaydediyoruz
  await addDoc(collection(db, "posts", postId, "comments"), {
    user_id: user.uid,
    username,
    profile_photo_url, // Denormalizasyon: Fotoğraf URL'sini yoruma kopyaladık
    text,
    created_date: serverTimestamp(),
  });

  // 🔢 COUNT +1
  await updateDoc(doc(db, "posts", postId), {
    comment_count: increment(1),
  });
};

/* ========== DELETE COMMENT ========== */

export const deleteComment = async (
  postId: string,
  commentId: string
) => {
  await deleteDoc(
    doc(db, "posts", postId, "comments", commentId)
  );

  // 🔢 COUNT -1
  await updateDoc(doc(db, "posts", postId), {
    comment_count: increment(-1),
  });
};

/* ========== SUBSCRIBE COMMENTS ========== */

export const subscribePostComments = (
  postId: string,
  callback: (comments: any[]) => void
) => {
  const q = query(
    collection(db, "posts", postId, "comments"),
    orderBy("created_date", "asc")
  );

  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    );
  });
};