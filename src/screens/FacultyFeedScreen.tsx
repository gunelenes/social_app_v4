import { useEffect, useState, useRef } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StatusBar,
  Animated,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc, collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import {
  subscribeFacultyFeedPosts,
  voteFacultyPoll,
} from "../firebase/facultyPosts";
import { downloadAndShareFile } from "../utils/downloadFile";

export default function FacultyFeedScreen({ navigation }: any) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [faculty, setFaculty] = useState("");
  const [username, setUsername] = useState("");
  const [commentsMap, setCommentsMap] = useState<Record<string, any[]>>({});

  const handleGoBack = () => navigation.navigate("MainTabs", { screen: "Feed" });
  const handleCreatePost = () => navigation.navigate("FacultyCreatePost");

  const handleProfilePress = (targetUserId: string) => {
    const currentUserId = auth.currentUser?.uid;
    if (targetUserId !== currentUserId) {
      navigation.navigate("UserDetail", { userId: targetUserId });
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "Az önce";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "Az önce";
    if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
    
    const days = Math.floor(diff / 86400);
    if (days === 1) return "Dün";
    if (days < 7) return `${days} gün önce`;
    
    return date.toLocaleDateString("tr-TR");
  };

  useEffect(() => {
    const loadUser = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data: any = snap.data();
        setFaculty(data.faculty || "");
        setUsername(data.username || "");

        const unsub = subscribeFacultyFeedPosts(data.faculty, (data) => {
          setPosts(data);
          setLoading(false);
        });

        return unsub;
      }
    };

    let unsub: any;
    loadUser().then((u) => (unsub = u));
    return () => unsub && unsub();
  }, []);

  // Comments subscription
  useEffect(() => {
    const unsubs: any[] = [];
    posts.forEach((post) => {
      const q = query(
        collection(db, "faculty_posts", post.id, "comments"),
        orderBy("created_at", "desc"),
        limit(2)
      );
      const unsub = onSnapshot(q, (snap) => {
        setCommentsMap((prev) => ({
          ...prev,
          [post.id]: snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })),
        }));
      });
      unsubs.push(unsub);
    });
    return () => unsubs.forEach((u) => u && u());
  }, [posts]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <View style={styles.loadingContainer}>
          <View style={styles.spinner} />
          <Text style={styles.loadingText}>Fakülten hazırlanıyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color="#1e293b" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🎓 {faculty}</Text>
          <Text style={styles.headerSubtitle}>Fakülte Feed</Text>
        </View>

        <View style={{ width: 28 }} />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const pollOptions = Array.isArray(item.poll_options) ? item.poll_options : [];
          const totalVotes = pollOptions.reduce((s: number, o: any) => s + (o.votes || 0), 0);
          const maxVotes = Math.max(...pollOptions.map((o: any) => o.votes || 0), 0);
          const comments = commentsMap[item.id] ?? [];
          const isMyPost = item.user_id === auth.currentUser?.uid;

          const pollEnded = item.poll_end_at && item.poll_end_at.toMillis() < Date.now();

          return (
            <View style={styles.card}>
              {/* Header */}
              <TouchableOpacity
                style={styles.cardHeader}
                activeOpacity={isMyPost ? 1 : 0.7}
                onPress={() => handleProfilePress(item.user_id)}
              >
                <View style={styles.avatarContainer}>
                  {item.profile_photo_url ? (
                    <Image
                      source={{ uri: item.profile_photo_url }}
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
                </View>
                <View style={styles.headerInfo}>
                  <Text style={styles.username}>@{item.username}</Text>
                  <Text style={styles.timestamp}>{formatTimestamp(item.created_at)}</Text>
                </View>
              </TouchableOpacity>

              {/* Content */}
              <View style={styles.content}>
                {item.type === "note" && <Text style={styles.text}>{item.text}</Text>}

                {item.type === "image" && (
                  <>
                    {!!item.text && <Text style={styles.text}>{item.text}</Text>}
                    <View style={styles.imageContainer}>
                      <Image source={{ uri: item.image_url }} style={styles.image} />
                    </View>
                  </>
                )}

                {item.type === "file" && (
                  <>
                    {!!item.text && <Text style={styles.text}>{item.text}</Text>}
                    <TouchableOpacity
                      style={styles.fileBox}
                      onPress={() => downloadAndShareFile(item.file_url, item.file_name || "dosya")}
                      activeOpacity={0.7}
                    >
                      <View style={styles.fileIconContainer}>
                        <Ionicons name="document" size={24} color="#667eea" />
                      </View>
                      <View style={styles.fileInfo}>
                        <Text style={styles.fileName} numberOfLines={1}>
                          {item.file_name}
                        </Text>
                        <Text style={styles.fileType}>Dosya</Text>
                      </View>
                      <View style={styles.downloadIcon}>
                        <Ionicons name="download-outline" size={20} color="#fff" />
                      </View>
                    </TouchableOpacity>
                  </>
                )}

                {item.type === "poll" && pollOptions.length > 0 && (
                  <View style={styles.pollBox}>
                    <Text style={styles.pollQuestion}>{item.text}</Text>

                    {pollEnded && (
                      <View style={styles.pollEndedBanner}>
                        <Ionicons name="time-outline" size={16} color="#ef4444" />
                        <Text style={styles.pollEndedText}>Anket sona erdi</Text>
                      </View>
                    )}

                    {pollOptions.map((opt: any, index: number) => {
                      const percent = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
                      const isTop = opt.votes === maxVotes && maxVotes > 0;

                      return (
                        <PollOption
                          key={index}
                          text={opt.text}
                          votes={opt.votes}
                          percent={percent}
                          isTop={isTop}
                          disabled={pollEnded}
                          onPress={async () => {
                            try {
                              await voteFacultyPoll(item.id, index, auth.currentUser!.uid);
                            } catch (e: any) {
                              Alert.alert("Uyarı", e.message || "Oy kullanılamadı");
                            }
                          }}
                        />
                      );
                    })}

                    <View style={styles.totalVotesContainer}>
                      <Text style={styles.totalVotes}>Toplam {totalVotes} oy</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Stats Footer */}
              <View style={styles.footer}>
                <View style={styles.statItem}>
                  <Ionicons name="chatbubble-outline" size={18} color="#64748b" />
                  <Text style={styles.statText}>{item.comment_count ?? 0}</Text>
                </View>
              </View>

              {/* Comments Preview */}
              {comments.length > 0 && (
                <View style={styles.commentsBox}>
                  {comments.map((c) => {
                    const isMyComment = c.user_id === auth.currentUser?.uid;
                    return (
                      <View key={c.id} style={styles.commentItem}>
                        <TouchableOpacity
                          activeOpacity={isMyComment ? 1 : 0.7}
                          onPress={() => handleProfilePress(c.user_id)}
                        >
                          <View style={styles.commentAvatar}>
                            {c.profile_photo_url ? (
                              <Image
                                source={{ uri: c.profile_photo_url }}
                                style={styles.commentAvatarImage}
                              />
                            ) : (
                              <Text style={styles.commentAvatarText}>
                                {c.username?.charAt(0).toUpperCase()}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                        <View style={styles.commentContent}>
                          <Text style={styles.commentText}>
                            <Text
                              style={styles.commentUsername}
                              onPress={() => handleProfilePress(c.user_id)}
                            >
                              @{c.username}
                            </Text>{" "}
                            {c.text}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              <TouchableOpacity
                onPress={() => navigation.navigate("FacultyComments", { postId: item.id })}
                style={styles.commentButton}
              >
                <Text style={styles.commentButtonText}>
                  💭 {comments.length > 0 ? "Tüm yorumları gör" : "İlk yorumu sen yap"}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleCreatePost} activeOpacity={0.9}>
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* ---------------------------------- */
/* POLL OPTION COMPONENT              */
/* ---------------------------------- */
function PollOption({ text, votes, percent, isTop, disabled, onPress }: any) {
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animWidth, {
      toValue: percent,
      useNativeDriver: false,
      friction: 8,
    }).start();
  }, [percent]);

  const width = animWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={[styles.pollOption, disabled && styles.pollOptionDisabled]}
      activeOpacity={0.7}
    >
      <Animated.View style={[styles.pollBar, { width }, isTop && styles.pollBarTop]} />
      <View style={styles.pollRow}>
        <Text style={styles.pollText}>{text}</Text>
        <View style={styles.pollVoteContainer}>
          <Text style={styles.pollPercent}>{percent}%</Text>
          <Text style={styles.pollVotes}>• {votes}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ---------------------------------- */
/* STYLES                             */
/* ---------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f5f7fa" },
  loadingContainer: { alignItems: "center", gap: 16 },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#e0e7ff",
    borderTopColor: "#667eea",
  },
  loadingText: { fontSize: 16, color: "#64748b", fontWeight: "600" },

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
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1e293b",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },

  listContent: { padding: 16, paddingBottom: 100 },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: "hidden",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
  },
  avatarContainer: { marginRight: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: 44, height: 44, borderRadius: 22 },
  avatarText: { color: "#ffffff", fontSize: 18, fontWeight: "700" },
  headerInfo: { flex: 1 },
  username: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  timestamp: { fontSize: 13, color: "#94a3b8", marginTop: 2 },

  content: { paddingHorizontal: 16 },
  text: { fontSize: 15, lineHeight: 22, color: "#334155", marginBottom: 12 },

  imageContainer: {
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
  },
  image: { width: "100%", height: 300, resizeMode: "cover" },

  fileBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
    marginTop: 8,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  fileInfo: { flex: 1, marginLeft: 12 },
  fileName: { fontSize: 15, fontWeight: "600", color: "#1e293b" },
  fileType: { fontSize: 13, color: "#64748b", marginTop: 2 },
  downloadIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#667eea",
    alignItems: "center",
    justifyContent: "center",
  },

  pollBox: { marginTop: 4, marginBottom: 12 },
  pollQuestion: { fontSize: 16, fontWeight: "700", color: "#1e293b", marginBottom: 12 },

  pollEndedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fef2f2",
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  pollEndedText: { fontSize: 13, fontWeight: "700", color: "#ef4444" },

  pollOption: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  pollOptionDisabled: {
    opacity: 0.7,
  },
  pollBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#e0e7ff",
  },
  pollBarTop: { backgroundColor: "#c7d2fe" },
  pollRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  pollText: { fontSize: 15, fontWeight: "600", color: "#1e293b", flex: 1 },
  pollVoteContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  pollPercent: { fontSize: 15, fontWeight: "700", color: "#667eea" },
  pollVotes: { fontSize: 13, color: "#64748b" },
  totalVotesContainer: { marginTop: 8 },
  totalVotes: { fontSize: 13, color: "#64748b", fontWeight: "600" },

  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  statText: { fontSize: 14, fontWeight: "600", color: "#64748b" },

  commentsBox: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  commentItem: { flexDirection: "row", gap: 10 },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center",
  },
  commentAvatarImage: { width: 32, height: 32, borderRadius: 16 },
  commentAvatarText: { color: "#667eea", fontSize: 14, fontWeight: "700" },
  commentContent: { flex: 1, backgroundColor: "#f8fafc", padding: 10, borderRadius: 12 },
  commentText: { fontSize: 14, color: "#334155" },
  commentUsername: { fontWeight: "700", color: "#1e293b" },

  commentButton: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f0f4ff",
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e7ff",
  },
  commentButtonText: { fontSize: 14, fontWeight: "700", color: "#667eea" },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    borderRadius: 32,
    elevation: 8,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});