import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export default function UserDetailScreen({ route }: any) {
  const { userId } = route.params;

  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- USER INFO ---------------- */
  useEffect(() => {
    const fetchUser = async () => {
      const snap = await getDoc(doc(db, "users", userId));
      if (snap.exists()) {
        setUser(snap.data());
      }
    };

    fetchUser();
  }, [userId]);

  /* ---------------- USER POSTS ---------------- */
  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      where("user_id", "==", userId),
      orderBy("created_date", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return unsub;
  }, [userId]);

  if (!user) {
    return (
      <SafeAreaView style={styles.loading}>
        <Text>Profil yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ListHeaderComponent={
          <>
            {/* -------- PROFILE HEADER -------- */}
            <View style={styles.profileHeader}>
              {user.photo_url ? (
                <Image
                  source={{ uri: user.photo_url }}
                  style={styles.avatar}
                />
              ) : (
                <LinearGradient
                  colors={["#667eea", "#764ba2"]}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>
                    {user.username?.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              )}

              <Text style={styles.username}>@{user.username}</Text>

              {user.bio ? (
                <Text style={styles.bio}>{user.bio}</Text>
              ) : (
                <Text style={styles.bioEmpty}>
                  Bu kullanıcı henüz bir biyografi eklemedi.
                </Text>
              )}
            </View>

            {/* -------- POSTS TITLE -------- */}
            <View style={styles.postsHeader}>
              <Text style={styles.postsTitle}>Paylaşımlar</Text>
            </View>
          </>
        }
        data={posts}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.postsContainer}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            {item.text && (
              <Text style={styles.postText}>{item.text}</Text>
            )}

            {item.image_url && (
              <Image
                source={{ uri: item.image_url }}
                style={styles.postImage}
              />
            )}
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>
              Bu kullanıcının henüz paylaşımı yok.
            </Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  profileHeader: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  avatarText: {
    color: "#ffffff",
    fontSize: 42,
    fontWeight: "700",
  },

  username: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },

  bio: {
    fontSize: 15,
    color: "#475569",
    textAlign: "center",
    lineHeight: 22,
  },

  bioEmpty: {
    fontSize: 14,
    color: "#94a3b8",
    fontStyle: "italic",
  },

  postsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f8fafc",
  },

  postsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },

  postsContainer: {
    padding: 16,
    paddingBottom: 40,
  },

  postCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },

  postText: {
    fontSize: 15,
    color: "#334155",
    marginBottom: 8,
  },

  postImage: {
    width: "100%",
    height: 260,
    borderRadius: 12,
  },

  emptyText: {
    textAlign: "center",
    marginTop: 32,
    color: "#94a3b8",
    fontSize: 14,
  },
});
