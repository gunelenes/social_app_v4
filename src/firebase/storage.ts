// src/firebase/storage.ts
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { auth, storage } from "./firebaseConfig";

// Expo / iOS için en stabil yöntem
const uriToBlob = (uri: string): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onerror = (error) => {
      console.error("❌ XHR Error:", error);
      reject(new Error("uriToBlob failed"));
    };
    xhr.onload = () => {
      console.log("✅ XHR Success, blob size:", xhr.response.size);
      resolve(xhr.response);
    };
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });

export const uploadPostImage = async (localUri: string): Promise<string> => {
  try {
    console.log("🚀 Starting upload process...");
    console.log("📍 Local URI:", localUri);
    
    // 1. Auth kontrolü
    const user = auth.currentUser;
    if (!user) {
      console.error("❌ No authenticated user");
      throw new Error("User not authenticated");
    }
    console.log("✅ User authenticated:", user.uid);

    // 2. Blob oluştur
    console.log("📦 Converting URI to Blob...");
    const blob = await uriToBlob(localUri);
    console.log("✅ Blob created:", {
      size: blob.size,
      type: blob.type,
    });

    // 3. Dosya adı
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
    const storagePath = `posts/${user.uid}/${fileName}`;
    console.log("📂 Storage path:", storagePath);

    // 4. Storage referansı
    const storageRef = ref(storage, storagePath);
    console.log("✅ Storage ref created");

    // 5. Upload (uploadBytesResumable ile daha iyi hata yakalama)
    console.log("⬆️ Starting upload...");
    const uploadTask = uploadBytesResumable(storageRef, blob, {
      contentType: "image/jpeg",
    });

    // Upload promise
    await new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`📊 Upload progress: ${progress.toFixed(0)}%`);
        },
        (error) => {
          console.error("❌ Upload error:", {
            code: error.code,
            message: error.message,
            serverResponse: error.serverResponse,
            // @ts-ignore
            customData: error.customData,
          });
          reject(error);
        },
        () => {
          console.log("✅ Upload completed!");
          resolve(uploadTask.snapshot);
        }
      );
    });

    // 6. Download URL al
    console.log("🔗 Getting download URL...");
    const downloadURL = await getDownloadURL(storageRef);
    console.log("✅ Download URL obtained:", downloadURL);

    // iOS memory leak önleme
    // @ts-ignore
    if (blob.close) blob.close();

    return downloadURL;
  } catch (error: any) {
    console.error("💥 UPLOAD FAILED:", {
      name: error.name,
      code: error.code,
      message: error.message,
      stack: error.stack?.split("\n").slice(0, 3),
    });
    throw error;
  }
};
