import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

/* =========================
   💬 MESSAGE TYPE
========================= */
export type ChatMessage = {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
  type: "text";
};

/* =========================
   📥 MESSAGES SUBSCRIBE
========================= */
export function subscribeMessages(
  chatId: string,
  cb: (msgs: ChatMessage[]) => void
) {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snap) => {
      const messages: ChatMessage[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ChatMessage, "id">),
      }));
      cb(messages);
    },
    (error) => {
      console.error("❌ subscribeMessages error:", error);
    }
  );
}

/* =========================
   👤 USERNAME GET (uid FIELD)
========================= */
async function getUsernameByUid(uid: string): Promise<string> {
  const q = query(
    collection(db, "users"),
    where("uid", "==", uid)
  );

  const snap = await getDocs(q);

  if (snap.empty) return "Kullanıcı";

  return snap.docs[0].data().username ?? "Kullanıcı";
}

/* =========================
   ✉️ SEND MESSAGE
========================= */
export async function sendTextMessage(params: {
  chatId: string;
  text: string;
  senderId: string;
  receiverId: string;
}) {
  const { chatId, text, senderId, receiverId } = params;

  const trimmed = text.trim();
  if (!trimmed) return;

  /* 1️⃣ MESSAGE */
  await addDoc(collection(db, "chats", chatId, "messages"), {
    text: trimmed,
    senderId,
    createdAt: serverTimestamp(),
    type: "text",
  });

  /* 2️⃣ USERNAMES */
  const [senderUsername, receiverUsername] = await Promise.all([
    getUsernameByUid(senderId),
    getUsernameByUid(receiverId),
  ]);

  /* 3️⃣ INBOX + CHAT SUMMARY */
  const batch = writeBatch(db);

  // sender inbox
  batch.set(
    doc(db, "userChats", senderId, "chats", chatId),
    {
      chatId,
      otherUserId: receiverId,
      otherUsername: receiverUsername,
      lastMessageText: trimmed,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // receiver inbox
  batch.set(
    doc(db, "userChats", receiverId, "chats", chatId),
    {
      chatId,
      otherUserId: senderId,
      otherUsername: senderUsername,
      lastMessageText: trimmed,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // chat summary
  batch.set(
    doc(db, "chats", chatId),
    {
      lastMessage: {
        text: trimmed,
        senderId,
        createdAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
      typing: {
        [senderId]: false,
      },
    },
    { merge: true }
  );

  await batch.commit();
}
