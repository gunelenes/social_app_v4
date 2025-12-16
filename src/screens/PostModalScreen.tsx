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
import * as DocumentPicker from "expo-document-picker";

import { auth } from "../firebase/firebaseConfig";
import { createPost } from "../firebase/posts";

type TabType = "text" | "image" | "file" | "poll";

export default function PostModalScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<TabType>("text");
  const [text, setText] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);

  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  const [loading, setLoading] = useState(false);

  const username = auth.currentUser?.email?.split("@")[0] ?? "";

  /* =========================================================
     IMAGE PICKER
  ========================================================= */
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setImageUri(asset.uri);

      // 🔥 RN → File objesi
      const fileObj: any = {
        uri: asset.uri,
        name: `image_${Date.now()}.jpg`,
        type: "image/jpeg",
      };

      setImageFile(fileObj);
    }
  };

  /* =========================================================
     FILE PICKER
  ========================================================= */
  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    const fileObj: any = {
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType ?? "application/octet-stream",
    };

    setFile(fileObj);
  };

  /* =========================================================
     SHARE
  ========================================================= */
  const handleShare = async () => {
    try {
      setLoading(true);

      /* 📝 TEXT */
      if (activeTab === "text") {
        if (!text.trim()) {
          Alert.alert("Hata", "Gönderi boş olamaz");
          return;
        }

        await createPost({
          type: "note",
          text,
        });
      }

      /* 📷 IMAGE */
      if (activeTab === "image") {
        if (!imageFile) {
          Alert.alert("Hata", "Fotoğraf seçmelisin");
          return;
        }

        await createPost({
          type: "image",
          text,
          imageFile,
        });
      }

      /* 📎 FILE */
      if (activeTab === "file") {
        if (!file) {
          Alert.alert("Hata", "Dosya seçmelisin");
          return;
        }

        await createPost({
          type: "file",
          text,
          file,
        });
      }

      /* 📊 POLL */
      if (activeTab === "poll") {
        const cleanOptions = pollOptions.filter((o) => o.trim());

        if (!text.trim() || cleanOptions.length < 2) {
          Alert.alert("Hata", "Anket için en az 2 seçenek gerekir");
          return;
        }

        await createPost({
          type: "poll",
          text,
          pollOptions: cleanOptions,
        });
      }

      // 🔄 RESET
      setText("");
      setImageUri(null);
      setImageFile(null);
      setFile(null);
      setPollOptions(["", ""]);

      navigation.goBack();
    } catch (err: any) {
      console.log("POST ERROR:", err);
      Alert.alert("Hata", err?.message ?? "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text>✕</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Yeni Gönderi</Text>

        <TouchableOpacity onPress={handleShare} disabled={loading}>
          <Text style={styles.shareText}>{loading ? "..." : "Paylaş"}</Text>
        </TouchableOpacity>
      </View>

      {/* USER */}
      <Text style={styles.userName}>@{username}</Text>

      {/* SEGMENT */}
      <View style={styles.segmentBar}>
        {[
          { key: "text", label: "📝 Yazı" },
          { key: "image", label: "📷 Fotoğraf" },
          { key: "file", label: "📎 Dosya" },
          { key: "poll", label: "📊 Anket" },
        ].map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[
              styles.segmentBtn,
              activeTab === t.key && styles.segmentBtnActive,
            ]}
            onPress={() => setActiveTab(t.key as TabType)}
          >
            <Text>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CONTENT */}
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {activeTab === "text" && (
          <TextInput
            placeholder="Ne düşünüyorsun?"
            value={text}
            onChangeText={setText}
            multiline
            style={styles.textInput}
          />
        )}

        {activeTab === "image" && (
          <>
            {!imageUri ? (
              <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
                <Text>📷 Fotoğraf Seç</Text>
              </TouchableOpacity>
            ) : (
              <>
                <Image source={{ uri: imageUri }} style={styles.image} />
                <TextInput
                  placeholder="Açıklama"
                  value={text}
                  onChangeText={setText}
                  style={styles.caption}
                />
              </>
            )}
          </>
        )}

        {activeTab === "file" && (
          <>
            <TouchableOpacity style={styles.uploadBox} onPress={pickFile}>
              <Text>📎 Dosya Seç</Text>
            </TouchableOpacity>

            {file && <Text>{file.name}</Text>}

            <TextInput
              placeholder="Açıklama (opsiyonel)"
              value={text}
              onChangeText={setText}
              style={styles.caption}
            />
          </>
        )}

        {activeTab === "poll" && (
          <View style={{ gap: 12 }}>
            <TextInput
              placeholder="Anket sorusu"
              value={text}
              onChangeText={setText}
              style={styles.textInput}
            />

            {pollOptions.map((opt, i) => (
              <TextInput
                key={i}
                placeholder={`Seçenek ${i + 1}`}
                value={opt}
                onChangeText={(v) => {
                  const copy = [...pollOptions];
                  copy[i] = v;
                  setPollOptions(copy);
                }}
                style={styles.caption}
              />
            ))}

            <TouchableOpacity
              onPress={() => setPollOptions([...pollOptions, ""])}
            >
              <Text style={{ color: "#667eea" }}>➕ Seçenek ekle</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* =========================================================
   STYLES
========================================================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },

  title: { fontWeight: "700", fontSize: 16 },

  shareText: { color: "#667eea", fontWeight: "700" },

  userName: { paddingHorizontal: 20, fontWeight: "600" },

  segmentBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginVertical: 10,
  },

  segmentBtn: {
    padding: 10,
    backgroundColor: "#f1f1f5",
    borderRadius: 14,
  },

  segmentBtnActive: {
    backgroundColor: "#d6dbff",
  },

  textInput: {
    minHeight: 120,
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#f8f9fa",
  },

  uploadBox: {
    height: 160,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  image: {
    width: "100%",
    height: 260,
    borderRadius: 20,
    marginBottom: 12,
  },

  caption: {
    backgroundColor: "#f8f9fa",
    padding: 14,
    borderRadius: 16,
  },
});
