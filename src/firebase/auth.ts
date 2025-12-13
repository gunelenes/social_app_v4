import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { auth } from "./firebaseConfig";

const ALLOWED_DOMAIN = "@ogr.deu.edu.tr";

// 📌 Domain kontrol
const isAllowedEmail = (email: string) =>
  email.endsWith(ALLOWED_DOMAIN);

// 🟢 Register
export const register = async (email: string, password: string) => {
  if (!isAllowedEmail(email)) {
    throw new Error("Sadece @ogr.deu.edu.tr uzantılı mail kabul edilir.");
  }

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  // 📧 Mail doğrulama gönder
  await sendEmailVerification(userCredential.user);

  await signOut(auth); // doğrulanmadan giriş yapamasın
};

// 🔵 Login
export const login = async (email: string, password: string) => {
  if (!isAllowedEmail(email)) {
    throw new Error("Geçersiz mail uzantısı.");
  }

  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  if (!userCredential.user.emailVerified) {
    await signOut(auth);
    throw new Error("Lütfen mail adresinizi doğrulayın.");
  }

  return userCredential.user;
};
