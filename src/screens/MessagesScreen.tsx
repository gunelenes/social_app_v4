import { useEffect, useState, useLayoutEffect } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../firebase/firebaseConfig";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

type InboxItem = {
  id: string;
  chatId: string;
  otherUserId: string;
  otherUsername: string;
  otherPhotoURL?: string | null;
  lastMessageText?: string;
  updatedAt?: any;
};

export default function MessagesScreen({ navigation }: any) {
  const currentUser = auth.currentUser;
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Mesajlar",
      headerStyle: {
        backgroundColor: "#fff",
      },
      headerTintColor: "#1e293b",
      headerTitleStyle: {
        fontWeight: "700",
      },
      headerShadowVisible: true,
    });
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "userChats", currentUser.uid, "chats"),
      orderBy("updatedAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as InboxItem[];
        setItems(list);
        setLoading(false);
      },
      (err) => {
        console.error("❌ MessagesScreen snapshot error:", err);
        setLoading(false);
      }
    );

    return unsub;
  }, [currentUser?.uid]);

  const openChat = (item: InboxItem) => {
    navigation.navigate("Chat", {
      chatId: item.chatId || item.id,
      otherUserId: item.otherUserId,
      otherUsername: item.otherUsername,
    });
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "Az önce";
    if (diff < 3600) return `${Math.floor(diff / 60)} dk`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} sa`;
    
    const days = Math.floor(diff / 86400);
    if (days === 1) return "Dün";
    if (days < 7) return `${days} gün`;
    
    return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <LinearGradient
          colors={["#f0f4ff", "#e0e7ff"]}
          style={styles.emptyIconGradient}
        >
          <Ionicons name="chatbubbles-outline" size={64} color="#667eea" />
        </LinearGradient>
      </View>
      <Text style={styles.emptyTitle}>Henüz mesaj yok</Text>
      <Text style={styles.emptyText}>
        Yeni mesaj başlatmak için aşağıdaki butona dokunun
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate("UserSearch")}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          style={styles.emptyButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.emptyButtonText}>Yeni Mesaj</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const LoadingState = () => (
    <View style={styles.loadingState}>
      <View style={styles.loadingSpinner} />
      <Text style={styles.loadingText}>Mesajlar yükleniyor...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {loading ? (
        <LoadingState />
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              items.length === 0 && styles.listContentEmpty,
            ]}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.chatCard}
                onPress={() => openChat(item)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={["#667eea", "#764ba2"]}
                  style={styles.avatar}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.avatarText}>
                    {item.otherUsername?.charAt(0).toUpperCase() ?? "?"}
                  </Text>
                </LinearGradient>

                <View style={styles.chatInfo}>
                  <View style={styles.chatHeader}>
                    <Text style={styles.username} numberOfLines={1}>
                      @{item.otherUsername ?? "Kullanıcı"}
                    </Text>
                    {item.updatedAt && (
                      <Text style={styles.time}>
                        {formatTime(item.updatedAt)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.messageRow}>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {item.lastMessageText ?? "Henüz mesaj yok"}
                    </Text>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={<EmptyState />}
          />

          {/* FAB - Yeni Mesaj */}
          {items.length > 0 && (
            <TouchableOpacity
              style={styles.fab}
              onPress={() => navigation.navigate("UserSearch")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#667eea", "#764ba2"]}
                style={styles.fabGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="create-outline" size={28} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },

  listContent: {
    padding: 16,
    paddingBottom: 100,
  },

  listContentEmpty: {
    flexGrow: 1,
  },

  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },

  chatInfo: {
    flex: 1,
    marginRight: 8,
  },

  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  username: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginRight: 8,
  },

  time: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 18,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },

  emptyIconContainer: {
    marginBottom: 24,
  },

  emptyIconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },

  emptyButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  emptyButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 10,
  },

  emptyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#e0e7ff",
    borderTopColor: "#667eea",
    marginBottom: 16,
  },

  loadingText: {
    fontSize: 15,
    color: "#64748b",
    fontWeight: "500",
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    borderRadius: 28,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },

  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});