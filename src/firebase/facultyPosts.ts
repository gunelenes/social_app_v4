import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  increment,
  runTransaction,
  getDocs
} from "firebase/firestore";
import { db } from "./firebaseConfig";

export const voteFacultyPoll = async (
  postId: string,
  optionIndex: number,
  userId: string
) => {
  const postRef = doc(db, "faculty_posts", postId);
  const votesRef = collection(db, "faculty_posts", postId, "votes");

  await runTransaction(db, async (tx) => {
    const postSnap = await tx.get(postRef);
    if (!postSnap.exists()) throw new Error("Post yok");

    const post = postSnap.data();

    // ⏳ Süre kontrolü
    if (post.poll_end_at && post.poll_end_at.toMillis() < Date.now()) {
      throw new Error("Anket sona erdi");
    }

    // Kullanıcının önceki oyu var mı?
    const q = query(votesRef, where("user_id", "==", userId));
    const prevVotes = await getDocs(q);

    // Önceki oy varsa geri al
    prevVotes.forEach((docSnap) => {
      const prev = docSnap.data();
      const prevIndex = prev.option_index;

      tx.update(postRef, {
        [`poll_options.${prevIndex}.votes`]:
          post.poll_options[prevIndex].votes - 1,
      });

      tx.delete(docSnap.ref);
    });

    // Yeni oy ekle
    tx.update(postRef, {
      [`poll_options.${optionIndex}.votes`]:
        post.poll_options[optionIndex].votes + 1,
    });

    tx.set(doc(votesRef), {
      user_id: userId,
      option_index: optionIndex,
    });
  });
};

/* =====================================================
   📝 FAKÜLTE POSTU OLUŞTURMA
===================================================== */
export const createFacultyPost = async (data: {
  text: string;
  type: "note" | "image" | "file" | "poll";
  faculty: string;
  username: string;
  user_id: string;
  profile_photo_url?: string;
  image_url?: string;
  file_url?: string;
  file_name?: string;
  poll_options?: { text: string; votes: number }[];
}) => {
  try {
    const docRef = await addDoc(collection(db, "faculty_posts"), {
      ...data,
      comment_count: 0,
      created_at: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error("❌ Faculty post oluşturma hatası:", error);
    throw error;
  }
};

/* =====================================================
   📡 FAKÜLTE FEED DİNLEME
===================================================== */
export const subscribeFacultyFeedPosts = (
  faculty: string,
  callback: (data: any[]) => void
) => {
  const q = query(
    collection(db, "faculty_posts"),
    where("faculty", "==", faculty),
    orderBy("created_at", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(posts);
  });
};

/* =====================================================
   📊 ANKET – TEK OY GARANTİLİ (SERVER SIDE)
===================================================== */
export const voteFacultyPollOnce = async (
  postId: string,
  optionIndex: number,
  userId: string
) => {
  const postRef = doc(db, "faculty_posts", postId);
  const voteRef = doc(db, "faculty_posts", postId, "votes", userId);

  await runTransaction(db, async (tx) => {
    const voteSnap = await tx.get(voteRef);

    // ❌ Daha önce oy vermiş mi?
    if (voteSnap.exists()) {
      throw new Error("Bu ankete zaten oy verdiniz");
    }

    // 🗳️ Oy kaydı (KULLANICI = 1 DOC)
    tx.set(voteRef, {
      option_index: optionIndex,
      created_at: serverTimestamp(),
    });

    // 📈 Oy artır
    tx.update(postRef, {
      [`poll_options.${optionIndex}.votes`]: increment(1),
    });
  });
};

/* =====================================================
   📥 KULLANICININ OYUNU OKUMA (UI için)
===================================================== */
export const getMyFacultyPollVote = async (
  postId: string,
  userId: string
): Promise<number | null> => {
  const voteRef = doc(db, "faculty_posts", postId, "votes", userId);
  const snap = await getDocs(
    query(collection(db, "faculty_posts", postId, "votes"))
  );

  const voteDoc = snap.docs.find((d) => d.id === userId);
  return voteDoc ? voteDoc.data().option_index : null;
};
