import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  runTransaction,
  getDoc, // Kullanıcı verisini çekmek için eklendi
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { db, auth, storage } from "./firebaseConfig";

/* ================= TYPES ================= */

export type PostType = "image" | "note" | "file" | "poll";

export type PollOption = {
  id: string;
  text: string;
  votes: number;
};

export type PollVote = {
  user_id: string;
  option_id: string;
};

/* =========================================================
   IMAGE UPLOAD (EXPO / RN SAFE)
========================================================= */

export const uploadImage = async (file: any): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const response = await fetch(file.uri);
  const blob = await response.blob();

  const filename = `${Date.now()}_${file.name ?? "image.jpg"}`;
  const storageRef = ref(storage, `images/${user.uid}/${filename}`);

  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
};

/* =========================================================
   FILE UPLOAD (EXPO / RN SAFE)
========================================================= */

export const uploadFile = async (file: any) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const response = await fetch(file.uri);
  const blob = await response.blob();

  const filename = `${Date.now()}_${file.name}`;
  const storageRef = ref(storage, `files/${user.uid}/${filename}`);

  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);

  return {
    file_url: url,
    file_name: file.name,
    file_type: file.type,
  };
};

/* =========================================================
   CREATE POST (UPDATED WITH PROFILE PHOTO)
========================================================= */

export const createPost = async (params: {
  type: PostType;
  text?: string;
  imageFile?: any;
  file?: any;
  pollOptions?: string[];
}) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  // 1. Kullanıcının profil bilgilerini Firestore'dan çek (Önemli Değişiklik)
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.exists() ? userSnap.data() : null;

  const username = userData?.username ?? user.email?.split("@")[0] ?? "unknown";
  const profile_photo_url = userData?.photo_url ?? ""; // Profil fotoğrafı alanını al

  let image_url = "";
  let file_url = "";
  let file_name = "";
  let file_type = "";
  let poll_options: PollOption[] = [];

  /* IMAGE */
  if (params.type === "image" && params.imageFile) {
    image_url = await uploadImage(params.imageFile);
  }

  /* FILE */
  if (params.type === "file" && params.file) {
    const uploaded = await uploadFile(params.file);
    file_url = uploaded.file_url;
    file_name = uploaded.file_name;
    file_type = uploaded.file_type;
  }

  /* POLL */
  if (params.type === "poll" && params.pollOptions) {
    poll_options = params.pollOptions.map((opt, i) => ({
      id: String(i),
      text: opt,
      votes: 0,
    }));
  }

  // 2. Postu profile_photo_url ile kaydet
  await addDoc(collection(db, "posts"), {
    user_id: user.uid,
    username,
    profile_photo_url, // Buraya eklendi
    type: params.type,
    text: params.text ?? "",
    image_url,
    file_url,
    file_name,
    file_type,
    poll_options,
    voted_user_ids: [],
    comment_count: 0,
    created_date: serverTimestamp(),
    is_active: true,
  });
};

/* =========================================================
   POLL – SINGLE CHOICE
========================================================= */

export const votePollSingleChoice = async (
  postId: string,
  optionIndex: number
) => {
  const user = auth.currentUser;
  if (!user) return;

  const postRef = doc(db, "posts", postId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(postRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const options: PollOption[] = data.poll_options ?? [];
    let votes: PollVote[] = data.voted_user_ids ?? [];

    const existing = votes.find(
      (v) => v.user_id === user.uid
    );

    if (existing) {
      const oldIndex = Number(existing.option_id);
      if (options[oldIndex]) {
        options[oldIndex].votes = Math.max(
          0,
          options[oldIndex].votes - 1
        );
      }
      votes = votes.filter(
        (v) => v.user_id !== user.uid
      );
    }

    options[optionIndex].votes += 1;
    votes.push({
      user_id: user.uid,
      option_id: String(optionIndex),
    });

    tx.update(postRef, {
      poll_options: options,
      voted_user_ids: votes,
    });
  });
};

/* =========================================================
   HOME FEED (REAL-TIME)
========================================================= */

export const subscribeHomeFeedPosts = (
  callback: (posts: any[]) => void
) => {
  const q = query(
    collection(db, "posts"),
    where("is_active", "==", true),
    orderBy("created_date", "desc")
  );

  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }))
    );
  });
};

/* =========================================================
   PROFILE FEED (MY POSTS)
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

  return onSnapshot(q, (snapshot) => {
    callback(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    );
  });
};