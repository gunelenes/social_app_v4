import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { auth, db, storage } from "../firebase/firebaseConfig";
import {
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

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

export default function CreateListingScreen({ navigation }: any) {
  const [shortText, setShortText] = useState("");
  const [longText, setLongText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  /* =========================
     📷 FOTOĞRAF SEÇ
  ========================= */
  const pickImages = async () => {
    if (images.length >= 5) {
      Alert.alert("En fazla 5 fotoğraf ekleyebilirsin");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
      quality: 0.8,
    });

    if (!res.canceled) {
      setImages((prev) => [
        ...prev,
        ...res.assets.map((a) => a.uri),
      ]);
    }
  };

  /* =========================
     ☁️ UPLOAD
  ========================= */
  const uploadImages = async (uid: string) => {
    const urls: string[] = [];

    for (const uri of images) {
      const blob = await (await fetch(uri)).blob();
      const fileRef = ref(
        storage,
        `listings/${uid}/${Date.now()}`
      );

      await uploadBytes(fileRef, blob);
      const url = await getDownloadURL(fileRef);
      urls.push(url);
    }

    return urls;
  };

  /* =========================
     🚀 PUBLISH
  ========================= */
  const publishListing = async () => {
    const uid = auth.currentUser?.uid;

    if (!uid) {
      Alert.alert("Hata", "Oturum bulunamadı");
      return;
    }

    if (!shortText || images.length === 0) {
      Alert.alert("Başlık ve en az 1 fotoğraf gerekli");
      return;
    }

    try {
      setLoading(true);

      // 🔥 GERÇEK USERNAME
      const username = await getUsernameByUid(uid);

      // ☁️ FOTO UPLOAD
      const imageUrls = await uploadImages(uid);

      // 📝 FIRESTORE KAYIT
      await addDoc(collection(db, "listings"), {
        userId: uid,
        username,
        shortText,
        longText,
        images: imageUrls,
        createdAt: serverTimestamp(),
      });

      Alert.alert("İlan yayınlandı 🎉");
      navigation.goBack();
    } catch (e) {
      console.error("❌ publishListing error:", e);
      Alert.alert("Hata", "İlan yayınlanamadı");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.label}>Kısa Açıklama</Text>
        <TextInput
          style={styles.input}
          value={shortText}
          onChangeText={setShortText}
          placeholder="İlan başlığı"
        />

        <Text style={styles.label}>Uzun Açıklama</Text>
        <TextInput
          style={[styles.input, { height: 120 }]}
          value={longText}
          onChangeText={setLongText}
          multiline
          placeholder="Detaylar"
        />

        {/* IMAGE PREVIEW */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {images.map((uri, i) => (
            <Image key={i} source={{ uri }} style={styles.preview} />
          ))}
        </ScrollView>

        <TouchableOpacity onPress={pickImages} style={styles.pickBtn}>
          <Text>📷 Fotoğraf Ekle ({images.length}/5)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.publish}
          onPress={publishListing}
          disabled={loading}
        >
          <Text style={styles.publishText}>
            {loading ? "Yükleniyor..." : "İlanı Yayınla"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: { fontWeight: "600", marginTop: 16 },
  input: {
    backgroundColor: "#f1f1f5",
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  preview: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 10,
    marginTop: 12,
  },
  pickBtn: {
    marginTop: 14,
    alignItems: "center",
  },
  publish: {
    marginTop: 30,
    backgroundColor: "#667eea",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  publishText: {
    color: "#fff",
    fontWeight: "700",
  },
});
