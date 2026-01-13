import { useLayoutEffect, useState } from "react";
import {
  ScrollView,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../firebase/firebaseConfig";
import { deleteDoc, doc } from "firebase/firestore";
import { ensureDirectChat } from "../services/chat";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const IMAGE_WIDTH = width;

export default function ListingDetailScreen({ route, navigation }: any) {
  const { listing } = route.params;
  const currentUid = auth.currentUser?.uid;
  const isOwner = currentUid === listing.uid;


  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollY = new Animated.Value(0);

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

  const onDelete = async () => {
    Alert.alert(
      "İlanı Sil",
      "Bu ilan kalıcı olarak silinecek. Emin misin?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "listings", listing.id));
              navigation.goBack();
            } catch {
              Alert.alert("Hata", "İlan silinemedi");
            }
          },
        },
      ]
    );
  };

  const onMessageSeller = async () => {
    if (!currentUid) return;

    try {
      const res = await ensureDirectChat({
        currentUid,
        otherUid: listing.uid,
        otherUsername: listing.username,
      });

      navigation.navigate("Chat", {
        chatId: res.chatId,
        otherUserId: listing.uid,
        otherUsername: listing.username,
      });
    } catch {
      Alert.alert("Hata", "Mesaj başlatılamadı");
    }
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / IMAGE_WIDTH);
    setCurrentImageIndex(currentIndex);
  };

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Image Slider */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={IMAGE_WIDTH}
            snapToAlignment="center"
          >
            {listing.images?.map((img: string, i: number) => (
              <View key={i} style={styles.imageWrapper}>
                <Image source={{ uri: img }} style={styles.image} />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.7)"]}
                  style={styles.imageGradient}
                />
              </View>
            ))}
          </ScrollView>

          {/* Image Counter */}
          {listing.images?.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {currentImageIndex + 1} / {listing.images.length}
              </Text>
            </View>
          )}

          {/* Dots Indicator */}
          {listing.images?.length > 1 && (
            <View style={styles.dotsContainer}>
              {listing.images.map((_: any, i: number) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    currentImageIndex === i && styles.activeDot,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* User Info Card */}
          <View style={styles.userCard}>
            <View style={styles.avatarContainer}>
              {listing.userPhoto ? (
            <Image
              source={{ uri: listing.userPhoto }}
              style={styles.avatarImage}
            />
          ) : (
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {listing.username?.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          )}

              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={18} color="#10b981" />
              </View>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.username}>@{listing.username}</Text>
              <Text style={styles.userRole}>İlan Sahibi</Text>
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.shortText}>{listing.shortText}</Text>
            <View style={styles.categoryBadge}>
              <LinearGradient
                colors={["#f59e0b", "#f97316"]}
                style={styles.categoryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.categoryText}>İLAN</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Description */}
          {listing.longText ? (
            <View style={styles.descriptionCard}>
              <View style={styles.descriptionHeader}>
                <Ionicons name="document-text-outline" size={20} color="#667eea" />
                <Text style={styles.descriptionTitle}>Açıklama</Text>
              </View>
              <Text style={styles.longText}>{listing.longText}</Text>
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {!isOwner && (
              <TouchableOpacity
                style={styles.messageButton}
                onPress={onMessageSeller}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#667eea", "#764ba2"]}
                  style={styles.messageGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
                  <Text style={styles.messageText}>Satıcıya Mesaj At</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {isOwner && (
              <>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() =>
                    navigation.navigate("EditListing", { listing })
                  }
                  activeOpacity={0.8}
                >
                  <View style={styles.editContent}>
                    <Ionicons name="create-outline" size={20} color="#667eea" />
                    <Text style={styles.editText}>İlanı Düzenle</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={onDelete}
                  activeOpacity={0.8}
                >
                  <View style={styles.deleteContent}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    <Text style={styles.deleteText}>İlanı Sil</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Safety Tips */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="shield-checkmark" size={20} color="#10b981" />
              <Text style={styles.tipsTitle}>Güvenlik İpuçları</Text>
            </View>
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>Kişisel bilgilerinizi paylaşmadan önce dikkatli olun</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>Güvenli ödeme yöntemlerini tercih edin</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>Şüpheli durumları bildirin</Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
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

  imageContainer: {
    position: "relative",
    height: 400,
  },

  imageWrapper: {
    width: IMAGE_WIDTH,
    height: 400,
  },

  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  imageGradient: {
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

  dotsContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },

  activeDot: {
    width: 20,
    backgroundColor: "#ffffff",
  },

  content: {
    padding: 16,
    paddingTop: 0,
  },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    marginTop: -40,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e5e7eb",
  },

  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
  },

  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 10,
  },

  userInfo: {
    flex: 1,
  },

  username: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 2,
  },

  userRole: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "500",
  },

  titleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  shortText: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    lineHeight: 28,
    marginRight: 12,
  },

  categoryBadge: {
    borderRadius: 10,
    overflow: "hidden",
  },

  categoryGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  categoryText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  descriptionCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  descriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },

  descriptionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },

  longText: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 24,
  },

  actionsContainer: {
    gap: 12,
    marginBottom: 16,
  },

  messageButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  messageGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },

  messageText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  editButton: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#667eea",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  editContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 10,
  },

  editText: {
    color: "#667eea",
    fontSize: 16,
    fontWeight: "700",
  },

  deleteButton: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#fee2e2",
    overflow: "hidden",
  },

  deleteContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 10,
  },

  deleteText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "700",
  },

  tipsCard: {
    backgroundColor: "#f0fdf4",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#bbf7d0",
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
    color: "#166534",
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
    color: "#10b981",
    fontWeight: "700",
    marginTop: 2,
  },

  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#166534",
    lineHeight: 20,
  },
});