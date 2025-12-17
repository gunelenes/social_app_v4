import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  deleteDoc,
  doc,
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

  const username = user.email?.split("@")[0] ?? "unknown";

  await addDoc(collection(db, "posts", postId, "comments"), {
    user_id: user.uid,
    username,
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
