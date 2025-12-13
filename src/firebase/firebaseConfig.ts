import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDbagyOd6xBwAXbyIQnthz9uJdCMEHE1Kc",
  authDomain: "uni-social-4c698.firebaseapp.com",
  projectId: "uni-social-4c698",
  storageBucket: "uni-social-4c698.appspot.com",
  messagingSenderId: "762143824545",
  appId: "1:762143824545:web:feee6d3dbbac91728a6ee0",
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app, "gs://uni-social-4c698.appspot.com");
export const auth = getAuth(app); // ⚠️ warning olabilir
export const db = getFirestore(app);
