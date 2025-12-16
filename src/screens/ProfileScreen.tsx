import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../firebase/firebaseConfig";
import { subscribeMyProfilePosts } from "../firebase/posts";

type TabType = "posts" | "files" | "notes" | "polls";

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [posts, setPosts] = useState<any[]>([]);

  /* 🔥 REAL-TIME PROFILE POSTS */
  useEffect(() => {
    const unsubscribe = subscribeMyProfilePosts(setPosts);
    return unsubscribe;
  }, []);

  const username = auth.currentUser?.email?.split("@")[0] ?? "";

  /* 🔹 SEGMENT FILTER */
  const filteredPosts = useMemo(() => {
    switch (activeTab) {
      case "notes":
        return posts.filter((p) => p.type === "note");

      case "posts":
        return posts.filter((p) => p.type === "image");

      case "files":
        return posts.filter((p) => p.type === "file");

      case "polls":
        return posts.filter((p) => p.type === "poll");

      default:
        return [];
    }
  }, [activeTab, posts]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          style={styles.headerGradient}
        >
          <View style={styles.avatarSection}>
            <View style={styles.avatarRing}>
              <Image
                source={{ uri: "https://i.pravatar.cc/150?img=3" }}
                style={styles.avatar}
              />
            </View>
            <Text style={styles.username}>{username}</Text>
          </View>
        </LinearGradient>

        {/* STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{posts.length}</Text>
            <Text style={styles.statText}>Gönderi</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statBox}>
            <Text style={styles.statNum}>0</Text>
            <Text style={styles.statText}>Takipçi</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statBox}>
            <Text style={styles.statNum}>0</Text>
            <Text style={styles.statText}>Takip</Text>
          </View>
        </View>

        {/* ACTIONS */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editText}>✏️ Profili Düzenle</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareBtn}>
            <Text style={{ fontSize: 20 }}>📤</Text>
          </TouchableOpacity>
        </View>

        {/* SEGMENT */}
        <View style={styles.segmentBar}>
          {["posts", "files", "notes", "polls"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.segmentBtn,
                activeTab === tab && styles.segmentBtnActive,
              ]}
              onPress={() => setActiveTab(tab as TabType)}
            >
              <Text
                style={[
                  styles.segmentText,
                  activeTab === tab && styles.segmentTextActive,
                ]}
              >
                {tab === "posts"
                  ? "Gönderiler"
                  : tab === "files"
                  ? "Dosyalar"
                  : tab === "notes"
                  ? "Mesajlar"
                  : "Anketler"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CONTENT */}
        {filteredPosts.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Henüz içerik yok</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredPosts.map((post) => (
              <View key={post.id} style={styles.gridItem}>
                {/* 🖼 IMAGE */}
                {post.type === "image" && (
                  <Image
                    source={{ uri: post.image_url }}
                    style={styles.postImage}
                  />
                )}

                {/* 📝 NOTE */}
                {post.type === "note" && (
                  <View style={styles.notePost}>
                    <Text numberOfLines={4} style={styles.noteText}>
                      {post.text}
                    </Text>
                  </View>
                )}

                {/* 📎 FILE */}
                {post.type === "file" && (
                  <View style={styles.filePost}>
                    <Text style={styles.fileIcon}>📎</Text>
                    <Text numberOfLines={2} style={styles.fileName}>
                      {post.file_name}
                    </Text>
                  </View>
                )}

                {/* 📊 POLL */}
                {post.type === "poll" && (
                  <View style={styles.pollPost}>
                    <Text numberOfLines={3} style={styles.pollText}>
                      {post.text}
                    </Text>
                    <Text style={styles.pollSub}>Anket</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },

  headerGradient: {
    paddingTop: 60,
    paddingBottom: 100,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },

  avatarSection: { alignItems: "center" },

  avatarRing: {
    padding: 5,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.3)",
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: "#fff",
  },

  username: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },

  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 30,
    marginTop: -50,
    borderRadius: 20,
    padding: 20,
  },

  statBox: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "700", color: "#667eea" },
  statText: { fontSize: 12, color: "#8e8e93" },
  divider: { width: 1, backgroundColor: "#e5e5ea" },

  actions: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },

  editBtn: {
    flex: 1,
    backgroundColor: "#667eea",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  editText: { color: "#fff", fontWeight: "600", fontSize: 16 },

  shareBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
  },

  segmentBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 6,
  },

  segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 12 },
  segmentBtnActive: { backgroundColor: "#667eea" },
  segmentText: { textAlign: "center", color: "#444" },
  segmentTextActive: { color: "#fff", fontWeight: "600" },

  emptyBox: { marginTop: 40, alignItems: "center" },
  emptyText: { color: "#8e8e93", fontSize: 15 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
    paddingHorizontal: 20,
    marginTop: 20,
  },

  gridItem: {
    width: (Dimensions.get("window").width - 42) / 2,
    height: (Dimensions.get("window").width - 42) / 2,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f1f1f5",
  },

  postImage: { width: "100%", height: "100%" },

  notePost: {
    flex: 1,
    backgroundColor: "#667eea",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },

  noteText: { color: "#fff", textAlign: "center" },

  filePost: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },

  fileIcon: { fontSize: 32 },
  fileName: { marginTop: 6, textAlign: "center", fontSize: 13 },

  pollPost: {
    flex: 1,
    backgroundColor: "#764ba2",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },

  pollText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  pollSub: { marginTop: 6, color: "#eee", fontSize: 12 },
});
