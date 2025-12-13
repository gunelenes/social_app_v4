import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import { auth } from "../firebase/firebaseConfig";
import { createPost } from "../firebase/posts";
import { uploadPostImage } from "../firebase/storage";

export default function PostModalScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<"text" | "image">("text");
  const [text, setText] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const username = auth.currentUser?.email?.split("@")[0] ?? "";

  // 📸 Fotoğraf seç
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // 🚀 Paylaş
  const handleShare = async () => {
    try {
      if (activeTab === "text" && !text.trim()) {
        Alert.alert("Hata", "Gönderi boş olamaz");
        return;
      }

      if (activeTab === "image" && !imageUri) {
        Alert.alert("Hata", "Fotoğraf seçmelisin");
        return;
      }

      setLoading(true);

      // 📝 Yazı post
      if (activeTab === "text") {
        await createPost({
          type: "note",
          text,
        });
      }

      // 📷 Fotoğraf post
      if (activeTab === "image") {
        const imageUrl = await uploadPostImage(imageUri!);

        await createPost({
          type: "image",
          text,
          image_url: imageUrl,
        });
      }

      setText("");
      setImageUri(null);
      navigation.goBack();
    } catch (err: any) {
      console.log("POST ERROR:", err?.code, err?.message, err);
      Alert.alert(
        "Hata",
        `${err?.code ?? ""} ${err?.message ?? "Bilinmeyen hata"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text>✕</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Yeni Gönderi</Text>

        <TouchableOpacity
          onPress={handleShare}
          disabled={loading}
          style={[styles.shareBtn, loading && { opacity: 0.5 }]}
        >
          <Text style={styles.shareText}>{loading ? "..." : "Paylaş"}</Text>
        </TouchableOpacity>
      </View>

      {/* USER */}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>@{username}</Text>
      </View>

      {/* SEGMENT */}
      <View style={styles.segmentBar}>
        {["text", "image"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.segmentBtn,
              activeTab === tab && styles.segmentBtnActive,
            ]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text
              style={{
                color: activeTab === tab ? "#fff" : "#333",
                fontWeight: "600",
              }}
            >
              {tab === "text" ? "📝 Yazı" : "📷 Fotoğraf"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CONTENT */}
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {activeTab === "text" && (
          <TextInput
            placeholder="Ne düşünüyorsun?"
            multiline
            value={text}
            onChangeText={setText}
            style={styles.textInput}
          />
        )}

        {activeTab === "image" && (
          <>
            {!imageUri ? (
              <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
                <Text style={{ fontSize: 40 }}>📷</Text>
                <Text>Fotoğraf Seç</Text>
              </TouchableOpacity>
            ) : (
              <>
                <Image source={{ uri: imageUri }} style={styles.image} />
                <TextInput
                  placeholder="Açıklama ekle..."
                  multiline
                  value={text}
                  onChangeText={setText}
                  style={styles.caption}
                />
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

//
// ---------------- STYLES ----------------
//
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    alignItems: "center",
  },

  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f1f5",
    alignItems: "center",
    justifyContent: "center",
  },

  title: { fontSize: 18, fontWeight: "700" },

  shareBtn: {
    backgroundColor: "#667eea",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },

  shareText: { color: "#fff", fontWeight: "700" },

  userInfo: { paddingHorizontal: 20 },
  userName: { fontWeight: "600" },

  segmentBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
  },

  segmentBtn: {
    padding: 12,
    backgroundColor: "#f1f1f5",
    borderRadius: 16,
  },

  segmentBtnActive: {
    backgroundColor: "#667eea",
  },

  textInput: {
    minHeight: 200,
    fontSize: 16,
    textAlignVertical: "top",
  },

  uploadBox: {
    height: 200,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },

  image: {
    width: "100%",
    height: 280,
    borderRadius: 20,
    marginBottom: 12,
  },

  caption: {
    backgroundColor: "#f8f9fa",
    padding: 14,
    borderRadius: 16,
    minHeight: 60,
  },
});
