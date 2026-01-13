import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useEffect, useLayoutEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const IMAGE_WIDTH = width - 32;

export default function ListingsFeedScreen({ navigation }: any) {
  const [listings, setListings] = useState<any[]>([]);
  const [imageIndices, setImageIndices] = useState<Record<string, number>>({});

  /* ---------------- HEADER ---------------- */
  useLayoutEffect(() => {
    navigation.setOptions({
      title: "İlanlar",
      headerBackTitleVisible: false,
      headerStyle: {
        backgroundColor: "#fff",
      },
      headerTintColor: "#1e293b",
      headerTitleStyle: {
        fontWeight: "700",
        fontSize: 20,
      },
    });
  }, []);

  /* ---------------- DATA ---------------- */
  useEffect(() => {
    const q = query(
      collection(db, "listings"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setListings(data);

      const indices: Record<string, number> = {};
      data.forEach((item) => {
        indices[item.id] = 0;
      });
      setImageIndices(indices);
    });
  }, []);

  const handleScroll = (listingId: string, event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / IMAGE_WIDTH);
    setImageIndices((prev) => ({
      ...prev,
      [listingId]: currentIndex,
    }));
  };

  /* ---------------- UI ---------------- */
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const currentImageIndex = imageIndices[item.id] || 0;
          const hasMultipleImages = item.images?.length > 1;

          return (
            <View style={styles.card}>
              {/* Header */}
              <View style={styles.cardHeader}>
                {item.userPhoto ? (
                <Image
                  source={{ uri: item.userPhoto }}
                  style={styles.avatarImage}
                />
              ) : (
                <LinearGradient
                  colors={["#667eea", "#764ba2"]}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>
                    {item.username?.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              )}


                <View style={styles.headerInfo}>
                  <Text style={styles.username}>@{item.username}</Text>
                  <Text style={styles.timestamp}>Yeni ilan</Text>
                </View>

                <LinearGradient
                  colors={["#f59e0b", "#f97316"]}
                  style={styles.badge}
                >
                  <Text style={styles.badgeText}>İLAN</Text>
                </LinearGradient>
              </View>

              {/* Text */}
              <Text style={styles.shortText}>{item.shortText}</Text>

              {/* Images */}
              {item.images?.length > 0 && (
                <View style={styles.imageSliderContainer}>
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={(e) => handleScroll(item.id, e)}
                    scrollEventThrottle={16}
                    snapToInterval={IMAGE_WIDTH}
                    decelerationRate="fast"
                  >
                    {item.images.map((img: string, i: number) => (
                      <View key={i} style={styles.imageWrapper}>
                        <Image source={{ uri: img }} style={styles.image} />
                      </View>
                    ))}
                  </ScrollView>

                  {hasMultipleImages && (
                    <>
                      <View style={styles.imageCounter}>
                        <Text style={styles.imageCounterText}>
                          {currentImageIndex + 1} / {item.images.length}
                        </Text>
                      </View>

                      <View style={styles.dotsContainer}>
                        {item.images.map((_: any, i: number) => (
                          <View
                            key={i}
                            style={[
                              styles.dot,
                              currentImageIndex === i && styles.activeDot,
                            ]}
                          />
                        ))}
                      </View>
                    </>
                  )}
                </View>
              )}

              {/* Button */}
              <TouchableOpacity
                style={styles.detailButton}
                onPress={() =>
                  navigation.navigate("ListingDetail", { listing: item })
                }
              >
                <LinearGradient
                  colors={["#667eea", "#764ba2"]}
                  style={styles.detailGradient}
                >
                  <Text style={styles.detailText}>İlanı İncele</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CreateListing")}
      >
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,     // ✅ HEADER ALTINDAN DÜZGÜN BAŞLAR
    paddingBottom: 120,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: "hidden",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  headerInfo: {
    flex: 1,
  },

  username: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },

  timestamp: {
    fontSize: 13,
    color: "#94a3b8",
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },

  shortText: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "600",
    color: "#1e293b",
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  imageSliderContainer: {
    marginBottom: 16,
  },

  imageWrapper: {
    width: IMAGE_WIDTH,
    paddingHorizontal: 16,
  },

  image: {
    width: "100%",
    height: 280,
    borderRadius: 16,
  },

  imageCounter: {
    position: "absolute",
    top: 16,
    right: 28,
    backgroundColor: "rgba(0,0,0,0.7)",
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
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },

  activeDot: {
    width: 20,
    backgroundColor: "#fff",
  },

  detailButton: {
    margin: 16,
    borderRadius: 14,
    overflow: "hidden",
  },

  detailGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    gap: 8,
  },

  detailText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
  },
    avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: "#e5e7eb",
  },

  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
