import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState, useLayoutEffect } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../firebase/firebaseConfig";
import { subscribeMyProfilePosts, votePollSingleChoice } from "../firebase/posts";
import { Ionicons } from "@expo/vector-icons";

type TabType = "posts" | "files" | "notes" | "polls";

const { width, height } = Dimensions.get("window");
const GRID_ITEM_SIZE = (width - 52) / 3;

export default function ProfileScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeMyProfilePosts(setPosts);
    return unsubscribe;
  }, []);

  const username = auth.currentUser?.email?.split("@")[0] ?? "";

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

  const tabs = [
    { key: "posts", label: "Gönderiler", icon: "images" },
    { key: "files", label: "Dosyalar", icon: "document-attach" },
    { key: "notes", label: "Notlar", icon: "document-text" },
    { key: "polls", label: "Anketler", icon: "bar-chart" },
  ];

  const openPostDetail = (post: any) => {
    setSelectedPost(post);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedPost(null), 300);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return "";
    return new Date(timestamp.toDate()).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleVote = async (optionIndex: number) => {
    if (!selectedPost) return;
    await votePollSingleChoice(selectedPost.id, optionIndex);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Gradient */}
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <SafeAreaView edges={["top"]}>
            <View style={styles.headerTop}>
              <View style={{ width: 40 }} />
              <Text style={styles.headerTitle}>Profil</Text>
              <TouchableOpacity style={styles.settingsButton} onPress={() => {}}>
                <Ionicons name="settings-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"]}
                  style={styles.avatarRing}
                >
                  <View style={styles.avatarWrapper}>
                    <Image
                      source={{ uri: "https://i.pravatar.cc/150?img=3" }}
                      style={styles.avatar}
                    />
                  </View>
                </LinearGradient>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={28} color="#10b981" />
                </View>
              </View>
              <Text style={styles.username}>@{username}</Text>
              <Text style={styles.userBio}>DEÜ Öğrencisi 🎓</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>Gönderi</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {posts.filter((p) => p.type === "image").length}
            </Text>
            <Text style={styles.statLabel}>Fotoğraf</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {posts.filter((p) => p.type === "poll").length}
            </Text>
            <Text style={styles.statLabel}>Anket</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.editButton} activeOpacity={0.8}>
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              style={styles.editGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
              <Text style={styles.editButtonText}>Profili Düzenle</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton} activeOpacity={0.8}>
            <Ionicons name="share-social-outline" size={20} color="#667eea" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key as TabType)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon as any}
                size={20}
                color={activeTab === tab.key ? "#667eea" : "#94a3b8"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content Grid */}
        {filteredPosts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <LinearGradient
                colors={["#f0f4ff", "#e0e7ff"]}
                style={styles.emptyIconGradient}
              >
                <Ionicons
                  name={
                    activeTab === "posts"
                      ? "images-outline"
                      : activeTab === "files"
                      ? "document-attach-outline"
                      : activeTab === "notes"
                      ? "document-text-outline"
                      : "bar-chart-outline"
                  }
                  size={64}
                  color="#667eea"
                />
              </LinearGradient>
            </View>
            <Text style={styles.emptyTitle}>Henüz içerik yok</Text>
            <Text style={styles.emptyText}>
              {activeTab === "posts"
                ? "Henüz fotoğraf paylaşmadınız"
                : activeTab === "files"
                ? "Henüz dosya paylaşmadınız"
                : activeTab === "notes"
                ? "Henüz not paylaşmadınız"
                : "Henüz anket oluşturmadınız"}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredPosts.map((post) => (
              <GridItem key={post.id} post={post} onPress={openPostDetail} />
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedPost?.type === "image"
                  ? "Fotoğraf"
                  : selectedPost?.type === "note"
                  ? "Not"
                  : selectedPost?.type === "file"
                  ? "Dosya"
                  : "Anket"}
              </Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#1e293b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedPost?.type === "image" && (
                <ImageDetail post={selectedPost} formatDate={formatDate} />
              )}
              {selectedPost?.type === "note" && (
                <NoteDetail post={selectedPost} formatDate={formatDate} />
              )}
              {selectedPost?.type === "file" && (
                <FileDetail post={selectedPost} formatDate={formatDate} />
              )}
              {selectedPost?.type === "poll" && (
                <PollDetail post={selectedPost} formatDate={formatDate} onVote={handleVote} />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Grid Item Component
const GridItem = ({ post, onPress }: any) => (
  <TouchableOpacity
    style={styles.gridItem}
    activeOpacity={0.8}
    onPress={() => onPress(post)}
  >
    {post.type === "image" && (
      <Image source={{ uri: post.image_url }} style={styles.postImage} />
    )}

    {post.type === "note" && (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.notePost}>
        <Ionicons
          name="document-text"
          size={24}
          color="rgba(255,255,255,0.3)"
          style={styles.gridIcon}
        />
        <Text numberOfLines={5} style={styles.gridNoteText}>
          {post.text}
        </Text>
      </LinearGradient>
    )}

    {post.type === "file" && (
      <View style={styles.filePost}>
        <View style={styles.fileIconContainer}>
          <Ionicons name="document" size={40} color="#667eea" />
        </View>
        <Text numberOfLines={2} style={styles.fileName}>
          {post.file_name}
        </Text>
      </View>
    )}

    {post.type === "poll" && (
      <LinearGradient colors={["#f59e0b", "#f97316"]} style={styles.pollPost}>
        <Ionicons
          name="bar-chart"
          size={28}
          color="rgba(255,255,255,0.4)"
          style={styles.gridIcon}
        />
        <Text numberOfLines={3} style={styles.gridPollText}>
          {post.text}
        </Text>
        <View style={styles.pollBadge}>
          <Ionicons name="people" size={10} color="#fff" />
          <Text style={styles.pollBadgeText}>
            {Array.isArray(post.poll_options)
              ? post.poll_options.reduce((sum: number, opt: any) => sum + (opt.votes || 0), 0)
              : 0}{" "}
            oy
          </Text>
        </View>
      </LinearGradient>
    )}
  </TouchableOpacity>
);

// Detail Components
const ImageDetail = ({ post, formatDate }: any) => (
  <View>
    <Image source={{ uri: post.image_url }} style={styles.detailImage} />
    {post.text && (
      <View style={styles.detailSection}>
        <Text style={styles.detailLabel}>Açıklama</Text>
        <Text style={styles.detailText}>{post.text}</Text>
      </View>
    )}
    <View style={styles.detailSection}>
      <View style={styles.detailInfo}>
        <Ionicons name="calendar-outline" size={16} color="#64748b" />
        <Text style={styles.detailInfoText}>{formatDate(post.created_date)}</Text>
      </View>
    </View>
  </View>
);

const NoteDetail = ({ post, formatDate }: any) => (
  <View>
    <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.detailNoteHeader}>
      <Ionicons name="document-text" size={48} color="rgba(255,255,255,0.3)" />
    </LinearGradient>
    <View style={styles.detailSection}>
      <Text style={styles.detailLabel}>Not İçeriği</Text>
      <Text style={styles.detailNoteText}>{post.text}</Text>
    </View>
    <View style={styles.detailSection}>
      <View style={styles.detailInfo}>
        <Ionicons name="calendar-outline" size={16} color="#64748b" />
        <Text style={styles.detailInfoText}>{formatDate(post.created_date)}</Text>
      </View>
    </View>
  </View>
);

const FileDetail = ({ post, formatDate }: any) => (
  <View>
    <View style={styles.detailFileHeader}>
      <View style={styles.detailFileIcon}>
        <Ionicons name="document" size={64} color="#667eea" />
      </View>
    </View>
    <View style={styles.detailSection}>
      <Text style={styles.detailLabel}>Dosya Adı</Text>
      <Text style={styles.detailFileName}>{post.file_name}</Text>
    </View>
    <View style={styles.detailSection}>
      <Text style={styles.detailLabel}>Dosya Tipi</Text>
      <Text style={styles.detailText}>{post.file_type}</Text>
    </View>
    <View style={styles.detailSection}>
      <View style={styles.detailInfo}>
        <Ionicons name="calendar-outline" size={16} color="#64748b" />
        <Text style={styles.detailInfoText}>{formatDate(post.created_date)}</Text>
      </View>
    </View>
    <TouchableOpacity style={styles.downloadButton}>
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={styles.downloadGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Ionicons name="download-outline" size={20} color="#fff" />
        <Text style={styles.downloadText}>Dosyayı İndir</Text>
      </LinearGradient>
    </TouchableOpacity>
  </View>
);

const PollDetail = ({ post, formatDate, onVote }: any) => {
  const pollOptions = Array.isArray(post.poll_options) ? post.poll_options : [];
  const totalVotes = pollOptions.reduce((sum: number, opt: any) => sum + (opt.votes || 0), 0);
  const maxVotes = Math.max(...pollOptions.map((o: any) => o.votes || 0), 0);
  const currentUserId = auth.currentUser?.uid;
  const userVote = post.voted_user_ids?.find((v: any) => v.user_id === currentUserId);
  const votedIndex = userVote ? Number(userVote.option_id) : null;

  return (
    <View>
      <LinearGradient colors={["#f59e0b", "#f97316"]} style={styles.detailPollHeader}>
        <Ionicons name="bar-chart" size={48} color="rgba(255,255,255,0.3)" />
        <Text style={styles.detailPollQuestion}>{post.text}</Text>
      </LinearGradient>

      <View style={styles.detailSection}>
        <Text style={styles.detailLabel}>Seçenekler</Text>
        {pollOptions.map((opt: any, index: number) => {
          const percent = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
          const isTop = opt.votes === maxVotes && maxVotes > 0;
          const isSelected = votedIndex === index;

          return (
            <TouchableOpacity
              key={index}
              onPress={() => onVote(index)}
              style={[styles.pollOption, isSelected && styles.pollOptionSelected]}
              activeOpacity={0.7}
            >
              <View style={[styles.pollBar, { width: `${percent}%` }, isTop && styles.pollBarTop]} />
              <View style={styles.pollOptionContent}>
                <Text style={styles.pollOptionText}>{opt.text}</Text>
                <View style={styles.pollOptionStats}>
                  <Text style={styles.pollOptionPercent}>{percent}%</Text>
                  <Text style={styles.pollOptionVotes}>({opt.votes})</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.detailSection}>
        <View style={styles.pollTotalStats}>
          <View style={styles.pollStatCard}>
            <Ionicons name="people" size={24} color="#667eea" />
            <Text style={styles.pollStatNumber}>{totalVotes}</Text>
            <Text style={styles.pollStatLabel}>Toplam Oy</Text>
          </View>
          <View style={styles.pollStatCard}>
            <Ionicons name="options" size={24} color="#f59e0b" />
            <Text style={styles.pollStatNumber}>{pollOptions.length}</Text>
            <Text style={styles.pollStatLabel}>Seçenek</Text>
          </View>
        </View>
      </View>

      <View style={styles.detailSection}>
        <View style={styles.detailInfo}>
          <Ionicons name="calendar-outline" size={16} color="#64748b" />
          <Text style={styles.detailInfoText}>{formatDate(post.created_date)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  headerGradient: { paddingBottom: 40 },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 20,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSection: { alignItems: "center", paddingBottom: 20 },
  avatarContainer: { position: "relative", marginBottom: 16 },
  avatarRing: { padding: 6, borderRadius: 68 },
  avatarWrapper: { borderRadius: 62, overflow: "hidden" },
  avatar: { width: 124, height: 124, borderWidth: 4, borderColor: "#fff", borderRadius: 62 },
  verifiedBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "#fff",
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  username: { fontSize: 24, fontWeight: "700", color: "#fff", marginBottom: 4 },
  userBio: { fontSize: 15, color: "rgba(255, 255, 255, 0.9)", fontWeight: "500" },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNumber: { fontSize: 24, fontWeight: "700", color: "#667eea", marginBottom: 4 },
  statLabel: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  statDivider: { width: 1, backgroundColor: "#e2e8f0", marginHorizontal: 8 },
  actionsContainer: { flexDirection: "row", paddingHorizontal: 20, marginTop: 20, gap: 12 },
  editButton: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  editGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  editButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  shareButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
  },
  tabActive: { backgroundColor: "#f0f4ff" },
  tabText: { fontSize: 12, fontWeight: "600", color: "#94a3b8" },
  tabTextActive: { color: "#667eea" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 80, paddingHorizontal: 32 },
  emptyIconContainer: { marginBottom: 24 },
  emptyIconGradient: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#1e293b", marginBottom: 8 },
  emptyText: { fontSize: 15, color: "#64748b", textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, paddingTop: 20, justifyContent: "space-between" },
  gridItem: { width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE, borderRadius: 16, overflow: "hidden", backgroundColor: "#f8fafc", marginBottom: 8 },
  postImage: { width: "100%", height: "100%", resizeMode: "cover" },
  notePost: { flex: 1, padding: 12, justifyContent: "space-between" },
  filePost: { flex: 1, padding: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" },
  fileIconContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#e0e7ff", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  fileName: { fontSize: 12, fontWeight: "600", color: "#1e293b", textAlign: "center" },
  pollPost: { flex: 1, padding: 12, justifyContent: "space-between" },
  gridIcon: { alignSelf: "flex-end", marginBottom: 8 },
  gridNoteText: { color: "#fff", fontSize: 12, lineHeight: 16, fontWeight: "500", flex: 1 },
  gridPollText: { color: "#fff", fontSize: 13, lineHeight: 17, fontWeight: "700", flex: 1 },
  pollBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255, 255, 255, 0.2)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 4, alignSelf: "flex-start" },
  pollBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: height * 0.85, paddingBottom: 20 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#1e293b" },
  closeButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  
  // Detail Styles
  detailImage: { width: "100%", height: 300, resizeMode: "cover" },
  detailSection: { padding: 20 },
  detailLabel: { fontSize: 14, fontWeight: "700", color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  detailText: { fontSize: 16, color: "#1e293b", lineHeight: 24 },
  detailNoteText: { fontSize: 17, color: "#1e293b", lineHeight: 26 },
  detailFileName: { fontSize: 16, fontWeight: "600", color: "#1e293b", marginBottom: 4 },
  detailInfo: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailInfoText: { fontSize: 14, color: "#64748b" },
  detailNoteHeader: { height: 150, alignItems: "center", justifyContent: "center" },
  detailFileHeader: { height: 180, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" },
  detailFileIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#e0e7ff", alignItems: "center", justifyContent: "center" },
  detailPollHeader: { padding: 24, alignItems: "center" },
  detailPollQuestion: { fontSize: 20, fontWeight: "700", color: "#fff", textAlign: "center", marginTop: 16 },
  
  // Poll Option Styles
  pollOption: { backgroundColor: "#f8fafc", borderRadius: 14, overflow: "hidden", marginBottom: 12, borderWidth: 2, borderColor: "transparent" },
  pollOptionSelected: { borderColor: "#667eea", backgroundColor: "#f0f4ff" },
  pollBar: { position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: "#e0e7ff", borderRadius: 12 },
  pollBarTop: { backgroundColor: "#c7d2fe" },
  pollOptionContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  pollOptionText: { flex: 1, fontSize: 15, fontWeight: "600", color: "#1e293b", marginRight: 12 },
  pollOptionStats: { flexDirection: "row", alignItems: "center", gap: 6 },
  pollOptionPercent: { fontSize: 16, fontWeight: "700", color: "#667eea" },
  pollOptionVotes: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  pollTotalStats: { flexDirection: "row", gap: 12 },
  pollStatCard: { flex: 1, backgroundColor: "#f8fafc", padding: 16, borderRadius: 14, alignItems: "center" },
  pollStatNumber: { fontSize: 24, fontWeight: "700", color: "#1e293b", marginTop: 8 },
  pollStatLabel: { fontSize: 12, color: "#64748b", fontWeight: "600", marginTop: 4 },
  
  // Download Button
  downloadButton: { marginHorizontal: 20, marginTop: 10, borderRadius: 14, overflow: "hidden" },
  downloadGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, gap: 8 },
  downloadText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});