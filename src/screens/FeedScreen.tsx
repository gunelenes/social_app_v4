import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from 'expo-linear-gradient';
import {
  subscribeHomeFeedPosts,
  votePollSingleChoice,
} from "../firebase/posts";
import { auth, db } from "../firebase/firebaseConfig";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { downloadAndShareFile } from "../utils/downloadFile";

export default function FeedScreen({ navigation }: any) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsMap, setCommentsMap] = useState<Record<string, any[]>>({});

  // 1. Profil Tıklama Mantığı: Sadece başkasıysa yeni sayfaya git
  const handleProfilePress = (targetUserId: string) => {
    const currentUserId = auth.currentUser?.uid;
    if (targetUserId !== currentUserId) {
      // UserDetail isminde yeni bir sayfa açıyoruz (bu ismi navigasyonda tanımlamalısın)
      navigation.navigate("UserDetail", { userId: targetUserId });
    }
  };

  // Zaman formatlama fonksiyonu
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
    const unsub = subscribeHomeFeedPosts((data) => {
      setPosts(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsubs: any[] = [];
    posts.forEach((post) => {
      const q = query(
        collection(db, "posts", post.id, "comments"),
        orderBy("created_date", "desc"),
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
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const pollOptions = Array.isArray(item.poll_options) ? item.poll_options : [];
          const userVote = item.voted_user_ids?.find((v: any) => v.user_id === auth.currentUser?.uid);
          const votedIndex = userVote ? Number(userVote.option_id) : null;
          const totalVotes = pollOptions.reduce((s: number, o: any) => s + (o.votes || 0), 0);
          const maxVotes = Math.max(...pollOptions.map((o: any) => o.votes || 0), 0);
          const comments = commentsMap[item.id] ?? [];
          const isMyPost = item.user_id === auth.currentUser?.uid;

          return (
            <View style={styles.card}>
              {/* Header: Kendi fotonuzda tıklama olmaz, başkasında UserDetail açılır */}
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
                      colors={['#667eea', '#764ba2']}
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
                  <Text style={styles.timestamp}>{formatTimestamp(item.created_date)}</Text>
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
                  <TouchableOpacity
                    style={styles.fileBox}
                    onPress={() => downloadAndShareFile(item.file_url, item.file_name || "dosya")}
                    activeOpacity={0.7}
                  >
                    <View style={styles.fileIconContainer}><Text style={styles.fileIcon}>📎</Text></View>
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName} numberOfLines={1}>{item.file_name}</Text>
                      <Text style={styles.fileType}>{item.file_type}</Text>
                    </View>
                    <View style={styles.downloadIcon}><Text style={styles.downloadText}>⬇️</Text></View>
                  </TouchableOpacity>
                )}
                {item.type === "poll" && pollOptions.length > 0 && (
                  <View style={styles.pollBox}>
                    <Text style={styles.pollQuestion}>{item.text}</Text>
                    {pollOptions.map((opt: any, index: number) => {
                      const percent = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
                      const isTop = opt.votes === maxVotes && maxVotes > 0;
                      const isSelected = votedIndex === index;
                      return (
                        <TouchableOpacity
                          key={index}
                          onPress={() => votePollSingleChoice(item.id, index)}
                          style={[styles.pollOption, isSelected && styles.selectedOption]}
                        >
                          <View style={[styles.pollBar, { width: `${percent}%` }, isTop && styles.pollBarTop]} />
                          <View style={styles.pollRow}>
                            <Text style={styles.pollText}>{opt.text}</Text>
                            <View style={styles.pollVoteContainer}>
                              <Text style={styles.pollPercent}>{percent}%</Text>
                              <Text style={styles.pollVotes}>• {opt.votes}</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                    <View style={styles.totalVotesContainer}><Text style={styles.totalVotes}>Toplam {totalVotes} oy</Text></View>
                  </View>
                )}
              </View>

              {/* Stats Footer */}
              <View style={styles.footer}>
                <View style={styles.statItem}>
                  <Text style={styles.statIcon}>💬</Text>
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
                              <Image source={{ uri: c.profile_photo_url }} style={styles.commentAvatarImage} />
                            ) : (
                              <Text style={styles.commentAvatarText}>{c.username?.charAt(0).toUpperCase()}</Text>
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
                            </Text> {c.text}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              <TouchableOpacity
                onPress={() => navigation.navigate("Comments", { postId: item.id })}
                style={styles.commentButton}
              >
                <Text style={styles.commentButtonText}>
                  💭 {comments.length > 0 ? 'Tüm yorumları gör' : 'İlk yorumu sen yap'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingContainer: { alignItems: "center", gap: 16 },
  spinner: { width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: "#e0e7ff", borderTopColor: "#667eea" },
  loadingText: { fontSize: 16, color: "#64748b" },
  listContent: { padding: 16, paddingBottom: 32 },
  card: { backgroundColor: "#ffffff", borderRadius: 20, marginBottom: 16, elevation: 3, overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "center", padding: 16, paddingBottom: 12 },
  avatarContainer: { marginRight: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "#667eea" },
  avatarImage: { width: 44, height: 44, borderRadius: 22 },
  avatarText: { color: "#ffffff", fontSize: 18, fontWeight: "700" },
  headerInfo: { flex: 1 },
  username: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  timestamp: { fontSize: 13, color: "#94a3b8" },
  content: { paddingHorizontal: 16 },
  text: { fontSize: 15, lineHeight: 22, color: "#334155", marginBottom: 12 },
  imageContainer: { marginTop: 8, marginBottom: 12, borderRadius: 16, overflow: "hidden" },
  image: { width: "100%", height: 300, resizeMode: "cover" },
  fileBox: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "#f8fafc", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 12 },
  fileIconContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#e0e7ff", alignItems: "center", justifyContent: "center" },
  fileIcon: { fontSize: 24 },
  fileInfo: { flex: 1, marginLeft: 12 },
  fileName: { fontSize: 15, fontWeight: "600", color: "#1e293b" },
  fileType: { fontSize: 13, color: "#64748b" },
  downloadIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#667eea", alignItems: "center", justifyContent: "center" },
  downloadText: { fontSize: 16 },
  pollBox: { marginTop: 4, marginBottom: 12 },
  pollQuestion: { fontSize: 16, fontWeight: "700", color: "#1e293b", marginBottom: 16 },
  pollOption: { backgroundColor: "#f8fafc", borderRadius: 14, overflow: "hidden", marginBottom: 10, borderWidth: 2, borderColor: "transparent" },
  selectedOption: { borderColor: "#667eea", backgroundColor: "#f0f4ff" },
  pollBar: { position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: "#e0e7ff" },
  pollBarTop: { backgroundColor: "#c7d2fe" },
  pollRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14 },
  pollText: { fontSize: 15, fontWeight: "600", color: "#1e293b", flex: 1 },
  pollVoteContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  pollPercent: { fontSize: 15, fontWeight: "700", color: "#667eea" },
  pollVotes: { fontSize: 13, color: "#64748b" },
  totalVotesContainer: { marginTop: 8 },
  totalVotes: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  footer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  statsContainer: { flexDirection: "row", alignItems: "center" },
  statItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  statIcon: { fontSize: 18 },
  statText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  commentsBox: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  commentItem: { flexDirection: "row", gap: 10 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#e0e7ff", alignItems: "center", justifyContent: "center" },
  commentAvatarImage: { width: 32, height: 32, borderRadius: 16 },
  commentAvatarText: { color: "#667eea", fontSize: 14, fontWeight: "700" },
  commentContent: { flex: 1, backgroundColor: "#f8fafc", padding: 10, borderRadius: 12 },
  commentText: { fontSize: 14, color: "#334155" },
  commentUsername: { fontWeight: "700", color: "#1e293b" },
  commentButton: { marginHorizontal: 16, marginTop: 12, marginBottom: 16, padding: 12, backgroundColor: "#f0f4ff", borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "#e0e7ff" },
  commentButtonText: { fontSize: 14, fontWeight: "700", color: "#667eea" },
});