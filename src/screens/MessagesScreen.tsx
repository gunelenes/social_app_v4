import { useEffect, useState } from "react";
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

  /* =========================
     📥 DM INBOX LISTENER
  ========================= */
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
      },
      (err) => {
        console.error("❌ MessagesScreen snapshot error:", err);
      }
    );

    return unsub;
  }, [currentUser?.uid]);

  /* =========================
     ➡️ CHAT AÇ
  ========================= */
  const openChat = (item: InboxItem) => {
    navigation.navigate("Chat", {
      chatId: item.chatId || item.id,
      otherUserId: item.otherUserId,
      otherUsername: item.otherUsername,
    });
  };

  /* =========================
     🧱 EMPTY STATE
  ========================= */
  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>Henüz mesaj yok</Text>
      <Text style={styles.emptySub}>
        Sağ alttaki + butonundan mesaj başlatabilirsin
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => openChat(item)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.otherUsername?.[0]?.toUpperCase() ?? "?"}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {item.otherUsername ?? "Kullanıcı"}
              </Text>
              <Text style={styles.last} numberOfLines={1}>
                {item.lastMessageText ?? "Henüz mesaj yok"}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{
          paddingBottom: 100,
          flexGrow: items.length === 0 ? 1 : 0,
        }}
      />

      {/* ➕ MESAJ BAŞLAT */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("UserSearch")}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* =========================
   🎨 STYLES
========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#667eea",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },

  last: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },

  emptySub: {
    fontSize: 14,
    color: "#777",
    marginTop: 8,
    textAlign: "center",
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#667eea",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },

  fabText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
    marginTop: -2,
  },
});
