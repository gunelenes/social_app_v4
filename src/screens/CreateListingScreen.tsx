import { useState, useLayoutEffect } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
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
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const IMAGE_SIZE = (width - 64) / 3;
const MAX_IMAGES = 5;

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

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "",
      headerTransparent: true,
      headerStyle: {
        backgroundColor: "transparent",
      },
      headerTintColor: "#fff",
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <View style={styles.headerIconContainer}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
      ),
    });
  }, []);

  const pickImages = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert("Limit", `En fazla ${MAX_IMAGES} fotoğraf ekleyebilirsiniz`);
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("İzin Gerekli", "Fotoğraf seçmek için galeri erişim izni gerekiyor");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.8,
      allowsEditing: false,
    });

    if (!res.canceled) {
      setImages((prev) => [
        ...prev,
        ...res.assets.map((a) => a.uri),
      ]);
    }
  };

  const removeImage = (index: number) => {
    Alert.alert(
      "Fotoğrafı Sil",
      "Bu fotoğrafı silmek istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: () => {
            setImages((prev) => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

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

  const publishListing = async () => {
    const uid = auth.currentUser?.uid;

    if (!uid) {
      Alert.alert("Hata", "Oturum bulunamadı");
      return;
    }

    if (!shortText.trim()) {
      Alert.alert("Uyarı", "Başlık boş olamaz");
      return;
    }

    if (images.length === 0) {
      Alert.alert("Uyarı", "En az 1 fotoğraf eklemelisiniz");
      return;
    }

    try {
      setLoading(true);

      const username = await getUsernameByUid(uid);
      const imageUrls = await uploadImages(uid);

      await addDoc(collection(db, "listings"), {
        userId: uid,
        username,
        shortText: shortText.trim(),
        longText: longText.trim(),
        images: imageUrls,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Başarılı! 🎉", "İlan yayınlandı", [
        {
          text: "Tamam",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (e) {
      console.error("❌ publishListing error:", e);
      Alert.alert("Hata", "İlan yayınlanamadı. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={["#667eea", "#764ba2"]}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroIcon}>
                <Ionicons name="add-circle-outline" size={48} color="#fff" />
              </View>
              <Text style={styles.heroTitle}>Yeni İlan Oluştur</Text>
              <Text style={styles.heroSubtitle}>
                İlanınızı paylaşın, diğer kullanıcılar görsün
              </Text>
            </View>
          </LinearGradient>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="information-circle" size={24} color="#667eea" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>İlan Bilgileri</Text>
              <Text style={styles.infoText}>
                Tüm alanları eksiksiz doldurun
              </Text>
            </View>
          </View>

          {/* Images Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Fotoğraflar</Text>
              <Text style={styles.imageCount}>
                {images.length} / {MAX_IMAGES}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imagesScroll}
            >
              {images.map((uri, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <LinearGradient
                      colors={["#ef4444", "#dc2626"]}
                      style={styles.removeImageGradient}
                    >
                      <Ionicons name="close" size={16} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                  {index === 0 && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>Ana</Text>
                    </View>
                  )}
                </View>
              ))}

              {images.length < MAX_IMAGES && (
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={pickImages}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={["#667eea", "#764ba2"]}
                    style={styles.addImageGradient}
                  >
                    <Ionicons name="add" size={32} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.addImageText}>Ekle</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            {images.length === 0 && (
              <View style={styles.emptyImages}>
                <Ionicons name="images-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyImagesText}>
                  Henüz fotoğraf eklemediniz
                </Text>
              </View>
            )}
          </View>

          {/* Title Input */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Başlık *</Text>
              <Text style={styles.charCount}>{shortText.length}/100</Text>
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="pricetag-outline"
                size={20}
                color="#94a3b8"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={shortText}
                onChangeText={setShortText}
                placeholder="İlan başlığını girin..."
                placeholderTextColor="#94a3b8"
                maxLength={100}
              />
            </View>
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Detaylı Açıklama</Text>
              <Text style={styles.charCount}>{longText.length}/500</Text>
            </View>
            <View style={styles.textAreaWrapper}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color="#94a3b8"
                style={styles.textAreaIcon}
              />
              <TextInput
                style={styles.textArea}
                value={longText}
                onChangeText={setLongText}
                multiline
                placeholder="İlanınız hakkında detaylı bilgi verin..."
                placeholderTextColor="#94a3b8"
                textAlignVertical="top"
                maxLength={500}
              />
            </View>
          </View>

          {/* Tips Card */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb-outline" size={20} color="#f59e0b" />
              <Text style={styles.tipsTitle}>İpuçları</Text>
            </View>
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>
                  İlk fotoğraf kapak resmi olacaktır
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>
                  Açık ve net bir başlık kullanın
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>
                  Detaylı açıklama ile ilana olan ilgiyi artırın
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Publish Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.publishButton,
              loading && styles.publishButtonDisabled,
            ]}
            onPress={publishListing}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                loading ? ["#cbd5e1", "#94a3b8"] : ["#667eea", "#764ba2"]
              }
              style={styles.publishGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <>
                  <View style={styles.loadingSpinner} />
                  <Text style={styles.publishText}>Yayınlanıyor...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  <Text style={styles.publishText}>İlanı Yayınla</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
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

  headerButton: {
    marginLeft: 16,
  },

  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },

  heroSection: {
    height: 220,
  },

  heroGradient: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 24,
  },

  heroContent: {
    alignItems: "center",
  },

  heroIcon: {
    marginBottom: 16,
  },

  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },

  heroSubtitle: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    fontWeight: "500",
  },

  scrollView: {
    flex: 1,
    marginTop: -20,
  },

  scrollContent: {
    backgroundColor: "#f5f7fa",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },

  infoCard: {
    flexDirection: "row",
    backgroundColor: "#eff6ff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },

  infoIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e40af",
    marginBottom: 4,
  },

  infoText: {
    fontSize: 14,
    color: "#1e40af",
    lineHeight: 20,
  },

  section: {
    marginBottom: 24,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },

  imageCount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#667eea",
  },

  imagesScroll: {
    gap: 12,
    paddingBottom: 4,
  },

  imageContainer: {
    position: "relative",
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 16,
    overflow: "hidden",
  },

  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 12,
    overflow: "hidden",
  },

  removeImageGradient: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "#667eea",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  primaryBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },

  addImageButton: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },

  addImageGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  addImageText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#667eea",
  },

  emptyImages: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyImagesText: {
    marginTop: 12,
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "500",
  },

  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
  },

  charCount: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "600",
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1e293b",
  },

  textAreaWrapper: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    padding: 14,
    minHeight: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  textAreaIcon: {
    marginRight: 10,
    marginTop: 2,
  },

  textArea: {
    flex: 1,
    fontSize: 15,
    color: "#1e293b",
    lineHeight: 22,
  },

  tipsCard: {
    backgroundColor: "#fef3c7",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fde68a",
  },

  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },

  tipsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#92400e",
  },

  tipsList: {
    gap: 8,
  },

  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  tipBullet: {
    fontSize: 16,
    color: "#f59e0b",
    fontWeight: "700",
    marginTop: 2,
  },

  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#92400e",
    lineHeight: 20,
  },

  footer: {
    padding: 16,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },

  publishButton: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  publishButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },

  publishGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },

  publishText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },

  loadingSpinner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderTopColor: "#fff",
  },
});