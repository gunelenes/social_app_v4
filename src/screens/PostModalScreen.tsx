import { useState, useLayoutEffect } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { auth } from "../firebase/firebaseConfig";
import { createPost } from "../firebase/posts";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setImageUri(asset.uri);

      const fileObj: any = {
        uri: asset.uri,
        name: `image_${Date.now()}.jpg`,
        type: "image/jpeg",
      };

      setImageFile(fileObj);
    }
  };

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

  const addPollOption = () => {
    if (pollOptions.length >= 5) {
      Alert.alert("Limit", "Maksimum 5 seçenek ekleyebilirsiniz");
      return;
    }
    setPollOptions([...pollOptions, ""]);
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length <= 2) {
      Alert.alert("Uyarı", "En az 2 seçenek olmalıdır");
      return;
    }
    setPollOptions(pollOptions.filter((_, i) => i !== index));
  };

  const handleShare = async () => {
    try {
      setLoading(true);

      if (activeTab === "text") {
        if (!text.trim()) {
          Alert.alert("Hata", "Gönderi boş olamaz");
          return;
        }
        await createPost({ type: "note", text });
      }

      if (activeTab === "image") {
        if (!imageFile) {
          Alert.alert("Hata", "Fotoğraf seçmelisin");
          return;
        }
        await createPost({ type: "image", text, imageFile });
      }

      if (activeTab === "file") {
        if (!file) {
          Alert.alert("Hata", "Dosya seçmelisin");
          return;
        }
        await createPost({ type: "file", text, file });
      }

      if (activeTab === "poll") {
        const cleanOptions = pollOptions.filter((o) => o.trim());

        if (!text.trim() || cleanOptions.length < 2) {
          Alert.alert("Hata", "Anket için soru ve en az 2 seçenek gerekir");
          return;
        }
        await createPost({ type: "poll", text, pollOptions: cleanOptions });
      }

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

  const tabs = [
    { key: "text", label: "Yazı", icon: "document-text" },
    { key: "image", label: "Fotoğraf", icon: "image" },
    { key: "file", label: "Dosya", icon: "attach" },
    { key: "poll", label: "Anket", icon: "bar-chart" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={26} color="#1e293b" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Yeni Gönderi</Text>
            <View style={styles.userInfo}>
              <View style={styles.userAvatarSmall}>
                <LinearGradient
                  colors={["#667eea", "#764ba2"]}
                  style={styles.avatarGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.avatarText}>
                    {username.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              </View>
              <Text style={styles.usernameSmall}>@{username}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleShare}
            disabled={loading}
            style={[styles.shareButton, loading && styles.shareButtonDisabled]}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={loading ? ["#cbd5e1", "#94a3b8"] : ["#667eea", "#764ba2"]}
              style={styles.shareGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <View style={styles.loadingSpinner} />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Tabs - Kompakt tasarım */}
        <View style={styles.tabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key as TabType)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={20}
                  color={activeTab === tab.key ? "#667eea" : "#64748b"}
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.key && styles.tabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === "text" && (
            <View style={styles.textContainer}>
              <TextInput
                placeholder="Ne düşünüyorsun?"
                value={text}
                onChangeText={setText}
                multiline
                style={styles.textInput}
                placeholderTextColor="#94a3b8"
                maxLength={500}
                autoFocus
              />
              <Text style={styles.charCount}>{text.length}/500</Text>
            </View>
          )}

          {activeTab === "image" && (
            <View style={styles.imageContainer}>
              {!imageUri ? (
                <TouchableOpacity
                  style={styles.uploadBox}
                  onPress={pickImage}
                  activeOpacity={0.7}
                >
                  <View style={styles.uploadIcon}>
                    <Ionicons name="image-outline" size={40} color="#667eea" />
                  </View>
                  <Text style={styles.uploadTitle}>Fotoğraf Seç</Text>
                  <Text style={styles.uploadSubtitle}>
                    Galerinizden bir fotoğraf ekleyin
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.imageContent}>
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => {
                        setImageUri(null);
                        setImageFile(null);
                      }}
                    >
                      <Ionicons name="close-circle" size={28} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    placeholder="Açıklama ekle..."
                    value={text}
                    onChangeText={setText}
                    multiline
                    style={styles.caption}
                    placeholderTextColor="#94a3b8"
                    maxLength={500}
                  />
                  <Text style={styles.charCount}>{text.length}/500</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === "file" && (
            <View style={styles.fileContainer}>
              {!file ? (
                <TouchableOpacity
                  style={styles.uploadBox}
                  onPress={pickFile}
                  activeOpacity={0.7}
                >
                  <View style={styles.uploadIcon}>
                    <Ionicons name="document-attach-outline" size={40} color="#667eea" />
                  </View>
                  <Text style={styles.uploadTitle}>Dosya Seç</Text>
                  <Text style={styles.uploadSubtitle}>
                    PDF, DOC veya diğer dosyalar
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.fileContent}>
                  <View style={styles.filePreview}>
                    <View style={styles.fileIcon}>
                      <Ionicons name="document" size={24} color="#667eea" />
                    </View>
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {file.name}
                      </Text>
                      <Text style={styles.fileType}>{file.type}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setFile(null)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    placeholder="Açıklama ekle..."
                    value={text}
                    onChangeText={setText}
                    multiline
                    style={styles.caption}
                    placeholderTextColor="#94a3b8"
                    maxLength={500}
                  />
                  <Text style={styles.charCount}>{text.length}/500</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === "poll" && (
            <View style={styles.pollContainer}>
              <TextInput
                placeholder="Anket sorunuzu yazın..."
                value={text}
                onChangeText={setText}
                multiline
                style={styles.pollQuestion}
                placeholderTextColor="#94a3b8"
                maxLength={200}
                autoFocus
              />
              <Text style={styles.charCount}>{text.length}/200</Text>

              <View style={styles.pollOptionsContainer}>
                {pollOptions.map((opt, i) => (
                  <View key={i} style={styles.pollOptionRow}>
                    <View style={styles.pollOptionNumber}>
                      <Text style={styles.pollOptionNumberText}>{i + 1}</Text>
                    </View>
                    <TextInput
                      placeholder={`Seçenek ${i + 1}`}
                      value={opt}
                      onChangeText={(v) => {
                        const copy = [...pollOptions];
                        copy[i] = v;
                        setPollOptions(copy);
                      }}
                      style={styles.pollOptionInput}
                      placeholderTextColor="#94a3b8"
                      maxLength={100}
                    />
                    {pollOptions.length > 2 && (
                      <TouchableOpacity
                        onPress={() => removePollOption(i)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="close-circle" size={22} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>

              {pollOptions.length < 5 && (
                <TouchableOpacity
                  style={styles.addOptionButton}
                  onPress={addPollOption}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#667eea" />
                  <Text style={styles.addOptionText}>Seçenek Ekle</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  keyboardView: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },

  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1e293b",
  },

  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  userAvatarSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: "hidden",
  },

  avatarGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },

  usernameSmall: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },

  shareButton: {
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },

  shareButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 1,
  },

  shareGradient: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingSpinner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderTopColor: "#fff",
  },

  tabsWrapper: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },

  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },

  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  tabActive: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },

  tabText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
  },

  tabTextActive: {
    color: "#667eea",
    fontWeight: "700",
  },

  scrollView: {
    flex: 1,
  },

  content: {
    padding: 16,
  },

  textContainer: {
    gap: 8,
  },

  textInput: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1e293b",
    minHeight: 180,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  charCount: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
    textAlign: "right",
  },

  imageContainer: {
    gap: 12,
  },

  uploadBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },

  uploadIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  uploadTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },

  uploadSubtitle: {
    fontSize: 13,
    color: "#64748b",
  },

  imageContent: {
    gap: 12,
  },

  imagePreviewContainer: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
  },

  imagePreview: {
    width: "100%",
    height: 280,
    borderRadius: 16,
  },

  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 14,
  },

  caption: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#1e293b",
    minHeight: 80,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  fileContainer: {
    gap: 12,
  },

  fileContent: {
    gap: 12,
  },

  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 12,
  },

  fileIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },

  fileInfo: {
    flex: 1,
  },

  fileName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },

  fileType: {
    fontSize: 12,
    color: "#64748b",
  },

  pollContainer: {
    gap: 12,
  },

  pollQuestion: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1e293b",
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  pollOptionsContainer: {
    gap: 10,
  },

  pollOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  pollOptionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },

  pollOptionNumberText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#667eea",
  },

  pollOptionInput: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#1e293b",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  addOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  addOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#667eea",
  },
});