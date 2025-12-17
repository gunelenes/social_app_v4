import {
  doc,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

/* =========================
   🔐 DETERMINISTIC CHAT ID
========================= */
export function makeDirectChatId(uidA: string, uidB: string) {
  return [uidA, uidB].sort().join("_");
}

/* =========================
   💬 CHAT OLUŞTUR
   - READ YOK
   - Permission safe
========================= */
export async function ensureDirectChat(params: {
  currentUid: string;
  otherUid: string;
  otherUsername?: string;
}) {
  const {
    currentUid,
    otherUid,
    otherUsername = "Kullanıcı",
  } = params;

  const chatId = makeDirectChatId(currentUid, otherUid);

  // Chat dokümanı (varsa merge)
  await setDoc(
    doc(db, "chats", chatId),
    {
      users: [currentUid, otherUid],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: null,
      typing: {},
    },
    { merge: true }
  );

  // SADECE kendi inbox
  const batch = writeBatch(db);

  batch.set(
    doc(db, "userChats", currentUid, "chats", chatId),
    {
      chatId,
      otherUserId: otherUid,
      otherUsername,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();

  return { chatId };
}

/* =========================
   ✍️ TYPING (SAFE)
========================= */
export async function setTyping(params: {
  chatId: string;
  uid: string;
  typing: boolean;
}) {
  const { chatId, uid, typing } = params;

  if (!chatId || !uid) return;

  await setDoc(
    doc(db, "chats", chatId),
    {
      typing: {
        [uid]: typing,
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
