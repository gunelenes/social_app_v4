// src/firebase/storage.ts
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, storage } from "./firebaseConfig";

// Expo / iOS için en stabil yöntem
const uriToBlob = (uri: string): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onerror = () => reject(new Error("uriToBlob failed"));
    xhr.onload = () => resolve(xhr.response);
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });

export const uploadPostImage = async (localUri: string): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const blob = await uriToBlob(localUri);

  const fileName = `${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}.jpg`;

  const storageRef = ref(storage, `posts/${user.uid}/${fileName}`);

  await uploadBytes(storageRef, blob, {
    contentType: "image/jpeg",
  });

  // iOS memory leak önleme
  // @ts-ignore
  if (blob.close) blob.close();

  return await getDownloadURL(storageRef);
};
