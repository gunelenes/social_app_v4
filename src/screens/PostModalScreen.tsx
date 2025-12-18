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
            <Ionicons name="close" size={28} color="#1e293b" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Yeni Gönderi</Text>

          <TouchableOpacity
            onPress={handleShare}
            disabled={loading}
            style={[
              styles.shareButton,
              loading && styles.shareButtonDisabled,
            ]}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                loading ? ["#cbd5e1", "#94a3b8"] : ["#667eea", "#764ba2"]
              }
              style={styles.shareGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <View style={styles.loadingSpinner} />
              ) : (
                <Text style={styles.shareText}>Paylaş</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={styles.userSection}>
          <LinearGradient
            colors={["#667eea", "#764ba2"]}
            style={styles.userAvatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.userAvatarText}>
              {username.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
          <Text style={styles.username}>@{username}</Text>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.tabActive,
              ]}
              onPress={() => setActiveTab(tab.key as TabType)}
              activeOpacity={0.7}
            >
              {activeTab === tab.key ? (
                <LinearGradient
                  colors={["#667eea", "#764ba2"]}
                  style={styles.tabGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name={tab.icon as any} size={18} color="#fff" />
                  <Text style={styles.tabTextActive}>{tab.label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.tabInactive}>
                  <Ionicons name={tab.icon as any} size={18} color="#64748b" />
                  <Text style={styles.tabText}>{tab.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

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
                  <View style={styles.uploadIconContainer}>
                    <LinearGradient
                      colors={["#e0e7ff", "#dbeafe"]}
                      style={styles.uploadIconGradient}
                    >
                      <Ionicons name="image-outline" size={48} color="#667eea" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.uploadTitle}>Fotoğraf Seç</Text>
                  <Text style={styles.uploadSubtitle}>
                    Galerinizden bir fotoğraf seçin
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => {
                        setImageUri(null);
                        setImageFile(null);
                      }}
                    >
                      <LinearGradient
                        colors={["#ef4444", "#dc2626"]}
                        style={styles.removeImageGradient}
                      >
                        <Ionicons name="close" size={20} color="#fff" />
                      </LinearGradient>
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
                </>
              )}
            </View>
          )}

          {activeTab === "file" && (
            <View style={styles.fileContainer}>
              <TouchableOpacity
                style={styles.uploadBox}
                onPress={pickFile}
                activeOpacity={0.7}
              >
                <View style={styles.uploadIconContainer}>
                  <LinearGradient
                    colors={["#e0e7ff", "#dbeafe"]}
                    style={styles.uploadIconGradient}
                  >
                    <Ionicons name="attach-outline" size={48} color="#667eea" />
                  </LinearGradient>
                </View>
                <Text style={styles.uploadTitle}>Dosya Seç</Text>
                <Text style={styles.uploadSubtitle}>
                  PDF, DOC veya diğer dosyalar
                </Text>
              </TouchableOpacity>

              {file && (
                <View style={styles.filePreview}>
                  <View style={styles.fileIconContainer}>
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
              )}

              <TextInput
                placeholder="Açıklama ekle (opsiyonel)"
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

          {activeTab === "poll" && (
            <View style={styles.pollContainer}>
              <View style={styles.pollQuestionContainer}>
                <Text style={styles.pollLabel}>Anket Sorusu</Text>
                <TextInput
                  placeholder="Sorunuzu yazın..."
                  value={text}
                  onChangeText={setText}
                  multiline
                  style={styles.pollQuestion}
                  placeholderTextColor="#94a3b8"
                  maxLength={200}
                />
                <Text style={styles.charCount}>{text.length}/200</Text>
              </View>

              <Text style={styles.pollLabel}>Seçenekler</Text>

              {pollOptions.map((opt, i) => (
                <View key={i} style={styles.pollOptionContainer}>
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
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {pollOptions.length < 5 && (
                <TouchableOpacity
                  style={styles.addOptionButton}
                  onPress={addPollOption}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle" size={20} color="#667eea" />
                  <Text style={styles.addOptionText}>Seçenek Ekle</Text>
                </TouchableOpacity>
              )}

              <View style={styles.pollInfo}>
                <Ionicons name="information-circle" size={18} color="#667eea" />
                <Text style={styles.pollInfoText}>
                  En az 2, en fazla 5 seçenek ekleyebilirsiniz
                </Text>
              </View>
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
    backgroundColor: "#f5f7fa",
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
    borderBottomColor: "#e2e8f0",
  },

  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },

  shareButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  shareButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 1,
  },

  shareGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },

  shareText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  loadingSpinner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderTopColor: "#fff",
  },

  userSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    gap: 12,
  },

  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  userAvatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  username: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },

  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
    backgroundColor: "#fff",
  },

  tab: {
    borderRadius: 12,
    overflow: "hidden",
  },

  tabActive: {
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  tabGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },

  tabInactive: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: "#f8fafc",
  },

  tabTextActive: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  tabText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
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
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: "#1e293b",
    minHeight: 200,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  charCount: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
    textAlign: "right",
  },

  imageContainer: {
    gap: 12,
  },

  uploadBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
  },

  uploadIconContainer: {
    marginBottom: 16,
  },

  uploadIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  uploadTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },

  uploadSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },

  imagePreviewContainer: {
    position: "relative",
    borderRadius: 20,
    overflow: "hidden",
  },

  imagePreview: {
    width: "100%",
    height: 300,
    borderRadius: 20,
  },

  removeImageButton: {
    position: "absolute",
    top: 12,
    right: 12,
    borderRadius: 20,
    overflow: "hidden",
  },

  removeImageGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  caption: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 1,
    fontSize: 15,
    color: "#1e293b",
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  fileContainer: {
    gap: 12,
  },

  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 12,
  },

  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center",
  },

  fileInfo: {
    flex: 1,
  },

  fileName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },

  fileType: {
    fontSize: 13,
    color: "#64748b",
  },

  pollContainer: {
    gap: 16,
  },

  pollQuestionContainer: {
    gap: 8,
  },

  pollLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },

  pollQuestion: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: "#1e293b",
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  pollOptionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },

  pollOptionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center",
  },

  pollOptionNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#667eea",
  },

  pollOptionInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#1e293b",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  addOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    backgroundColor: "#f0f4ff",
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },

  addOptionText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#667eea",
  },

  pollInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },

  pollInfoText: {
    flex: 1,
    fontSize: 13,
    color: "#1e40af",
    lineHeight: 18,
  },
});