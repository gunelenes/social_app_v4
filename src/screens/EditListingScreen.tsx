import { useState, useLayoutEffect } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { doc, updateDoc } from "firebase/firestore";
import { db, storage } from "../firebase/firebaseConfig";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const IMAGE_SIZE = (width - 48) / 3;
const MAX_IMAGES = 5;

export default function EditListingScreen({ route, navigation }: any) {
  const { listing } = route.params;

  const [shortText, setShortText] = useState(listing.shortText);
  const [longText, setLongText] = useState(listing.longText);
  const [images, setImages] = useState<string[]>(listing.images || []);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
          onPress={() => {
            if (hasChanges()) {
              Alert.alert(
                "Değişiklikleri İptal Et",
                "Yaptığınız değişiklikler kaydedilmeyecek. Emin misiniz?",
                [
                  { text: "Devam Et", style: "cancel" },
                  {
                    text: "İptal Et",
                    style: "destructive",
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            } else {
              navigation.goBack();
            }
          }}
          style={styles.headerButton}
        >
          <View style={styles.headerIconContainer}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
      ),
    });
  }, [shortText, longText, images]);

  const pickImage = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert("Limit", `Maksimum ${MAX_IMAGES} fotoğraf ekleyebilirsiniz`);
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("İzin Gerekli", "Fotoğraf seçmek için galeri erişim izni gerekiyor");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setIsUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `listings/${listing.id}/${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      setImages((prev) => [...prev, downloadURL]);
    } catch (error) {
      Alert.alert("Hata", "Fotoğraf yüklenemedi");
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = (imageUrl: string, index: number) => {
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

  const onSave = async () => {
    if (!shortText.trim()) {
      Alert.alert("Uyarı", "Başlık boş olamaz");
      return;
    }

    if (images.length === 0) {
      Alert.alert("Uyarı", "En az 1 fotoğraf eklemelisiniz");
      return;
    }

    setIsSaving(true);
    try {
      await updateDoc(doc(db, "listings", listing.id), {
        shortText: shortText.trim(),
        longText: longText.trim(),
        images: images,
      });
      Alert.alert("Başarılı! ✅", "İlan güncellendi", [
        {
          text: "Tamam",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert("Hata", "İlan güncellenemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = () => {
    const imagesChanged = JSON.stringify(images) !== JSON.stringify(listing.images || []);
    return (
      shortText.trim() !== listing.shortText ||
      longText.trim() !== listing.longText ||
      imagesChanged
    );
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Image Section */}
          <View style={styles.heroSection}>
            {images.length > 0 ? (
              <>
                <Image source={{ uri: images[0] }} style={styles.heroImage} />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.7)"]}
                  style={styles.heroGradient}
                />
              </>
            ) : (
              <View style={styles.heroPlaceholder}>
                <Ionicons name="images-outline" size={64} color="#cbd5e1" />
                <Text style={styles.heroPlaceholderText}>Fotoğraf Ekle</Text>
              </View>
            )}
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {images.length} / {MAX_IMAGES}
              </Text>
            </View>
          </View>

          {/* Image Gallery */}
          <View style={styles.gallerySection}>
            <Text style={styles.galleryTitle}>Fotoğraflar</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryScroll}
            >
              {images.map((img, index) => (
                <View key={index} style={styles.galleryItem}>
                  <Image source={{ uri: img }} style={styles.galleryImage} />
                  <TouchableOpacity
                    style={styles.deleteImageBtn}
                    onPress={() => deleteImage(img, index)}
                  >
                    <LinearGradient
                      colors={["#ef4444", "#dc2626"]}
                      style={styles.deleteImageGradient}
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
                  style={styles.addImageBtn}
                  onPress={pickImage}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <View style={styles.uploadingContainer}>
                      <View style={styles.uploadingSpinner} />
                      <Text style={styles.uploadingText}>Yükleniyor...</Text>
                    </View>
                  ) : (
                    <>
                      <LinearGradient
                        colors={["#667eea", "#764ba2"]}
                        style={styles.addImageGradient}
                      >
                        <Ionicons name="add" size={32} color="#fff" />
                      </LinearGradient>
                      <Text style={styles.addImageText}>Ekle</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="information-circle" size={24} color="#667eea" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Fotoğraf İpuçları</Text>
              <Text style={styles.infoText}>
                • İlk fotoğraf kapak resmi olacaktır{"\n"}
                • En fazla {MAX_IMAGES} fotoğraf ekleyebilirsiniz{"\n"}
                • Kaliteli ve net fotoğraflar kullanın
              </Text>
            </View>
          </View>

          {/* Short Text Input */}
          <View style={styles.inputContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Başlık</Text>
              <Text style={styles.charCount}>{shortText.length}/100</Text>
            </View>
            <View
              style={[
                styles.inputWrapper,
                shortText.trim() && styles.inputWrapperFocused,
              ]}
            >
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

          {/* Long Text Input */}
          <View style={styles.inputContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Detaylı Açıklama</Text>
              <Text style={styles.charCount}>{longText.length}/500</Text>
            </View>
            <View
              style={[
                styles.textAreaWrapper,
                longText.trim() && styles.inputWrapperFocused,
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={20}
                color="#94a3b8"
                style={styles.textAreaIcon}
              />
              <TextInput
                style={styles.textArea}
                value={longText}
                multiline
                onChangeText={setLongText}
                placeholder="İlanınız hakkında detaylı bilgi verin..."
                placeholderTextColor="#94a3b8"
                textAlignVertical="top"
                maxLength={500}
              />
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              if (hasChanges()) {
                Alert.alert(
                  "Değişiklikleri İptal Et",
                  "Yaptığınız değişiklikler kaydedilmeyecek. Emin misiniz?",
                  [
                    { text: "Devam Et", style: "cancel" },
                    {
                      text: "İptal Et",
                      style: "destructive",
                      onPress: () => navigation.goBack(),
                    },
                  ]
                );
              } else {
                navigation.goBack();
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.cancelContent}>
              <Ionicons name="close-circle-outline" size={20} color="#64748b" />
              <Text style={styles.cancelText}>İptal</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveButton,
              (!hasChanges() || isSaving || isUploading) && styles.saveButtonDisabled,
            ]}
            onPress={onSave}
            disabled={!hasChanges() || isSaving || isUploading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                !hasChanges() || isSaving || isUploading
                  ? ["#cbd5e1", "#94a3b8"]
                  : ["#667eea", "#764ba2"]
              }
              style={styles.saveGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isSaving ? (
                <>
                  <View style={styles.loadingSpinner} />
                  <Text style={styles.saveText}>Kaydediliyor...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.saveText}>Kaydet</Text>
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

  scrollView: {
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
    height: 300,
    position: "relative",
    backgroundColor: "#e2e8f0",
  },

  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  heroPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
  },

  heroPlaceholderText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#94a3b8",
  },

  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },

  imageCounter: {
    position: "absolute",
    top: 60,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  imageCounterText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  gallerySection: {
    marginTop: -20,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },

  galleryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  galleryScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },

  galleryItem: {
    position: "relative",
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 12,
    overflow: "hidden",
  },

  galleryImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  deleteImageBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    borderRadius: 12,
    overflow: "hidden",
  },

  deleteImageGradient: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
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

  addImageBtn: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 12,
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

  uploadingContainer: {
    alignItems: "center",
  },

  uploadingSpinner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#e0e7ff",
    borderTopColor: "#667eea",
    marginBottom: 8,
  },

  uploadingText: {
    fontSize: 12,
    color: "#667eea",
    fontWeight: "600",
  },

  infoCard: {
    flexDirection: "row",
    backgroundColor: "#eff6ff",
    margin: 16,
    padding: 16,
    borderRadius: 16,
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
  
  },

  infoText: {
    fontSize: 13,
   
  },

  inputContainer: {
    marginHorizontal: 16,

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

  inputWrapperFocused: {
    borderColor: "#667eea",
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

  footer: {
    flexDirection: "row",
    padding: 16,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },

  cancelButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },

  cancelContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },

  cancelText: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "700",
  },

  saveButton: {
    flex: 2,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  saveButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },

  saveGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },

  saveText: {
    color: "#fff",
    fontSize: 16,
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
});