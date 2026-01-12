import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Modal,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../firebase/firebaseConfig";
import { votePollSingleChoice } from "../firebase/posts";

type TabType = "posts" | "files" | "notes" | "polls";

const { width, height } = Dimensions.get("window");
const GRID_GAP = 8;
const GRID_ITEM_SIZE = (width - 16 * 2 - GRID_GAP * 2) / 3;

export default function UserDetailScreen({ route, navigation }: any) {
  const { userId } = route.params;

  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>("posts");

  useEffect(() => {
    const fetchUser = async () => {
      const snap = await getDoc(doc(db, "users", userId));
      if (snap.exists()) setUser(snap.data());
    };
    fetchUser();
  }, [userId]);

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

  const avatarUri = user?.photo_url || "https://i.pravatar.cc/150?img=3";

  const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return "";
    return new Date(timestamp.toDate()).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openPostDetail = (post: any) => {
    setSelectedPost(post);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedPost(null), 250);
  };

  const handleVote = async (optionIndex: number) => {
    if (!selectedPost) return;
    await votePollSingleChoice(selectedPost.id, optionIndex);
  };

  const postCounts = useMemo(() => {
    const total = posts.length;
    const images = posts.filter((p) => p.type === "image").length;
    const polls = posts.filter((p) => p.type === "poll").length;
    const notes = posts.filter((p) => p.type === "note").length;
    const files = posts.filter((p) => p.type === "file").length;
    return { total, images, polls, notes, files };
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (activeTab === "posts") return posts;
    if (activeTab === "files") return posts.filter((p) => p.type === "file");
    if (activeTab === "notes") return posts.filter((p) => p.type === "note");
    if (activeTab === "polls") return posts.filter((p) => p.type === "poll");
    return posts;
  }, [posts, activeTab]);

  if (!user) {
    return (
      <SafeAreaView style={styles.loading}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContent}>
          <LinearGradient
            colors={["#f0f4ff", "#e0e7ff"]}
            style={styles.loadingIcon}
          >
            <Ionicons name="person-outline" size={40} color="#667eea" />
          </LinearGradient>
          <Text style={styles.loadingText}>Profil yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <FlatList
        data={filteredPosts}
        numColumns={3}
        keyExtractor={(i) => i.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContainer}
        ListHeaderComponent={
          <>
            {/* TOP GRADIENT HEADER (Ekran görüntüsü gibi) */}
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              style={styles.topHeader}
            >
              <SafeAreaView edges={["top"]} style={{ width: "100%" }}>
                <View style={styles.topHeaderBar}>
                  <TouchableOpacity
                    style={styles.topIconBtn}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                  </TouchableOpacity>

                  <Text style={styles.profileTitle}>Profil</Text>

                  <View style={{ width: 40 }} />
                </View>
              </SafeAreaView>

              <View style={styles.avatarBlock}>
                <View style={styles.avatarOuter}>
                  <View style={styles.avatarInner}>
                    <Image source={{ uri: avatarUri }} style={styles.avatarBig} />
                  </View>

                  {/* Doğrulama rozeti */}
                  <View style={styles.verifyBadge}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                </View>
              </View>

              <Text style={styles.usernameBig}>@{user.username}</Text>

              <Text style={styles.subText}>
                {user.bio || "DEÜ Öğrencisi 🎓 jikkkhcx"}
              </Text>

              <Text style={styles.subTextLight}>
                {user.faculty ? `${user.faculty} • ` : ""}
                Dokuz Eylül Üniversitesi
              </Text>
            </LinearGradient>

            {/* STATS CARD (Gönderi/Fotoğraf/Anket) */}
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{postCounts.total}</Text>
                <Text style={styles.statLabel}>Gönderi</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={styles.statValue}>{postCounts.images}</Text>
                <Text style={styles.statLabel}>Fotoğraf</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={styles.statValue}>{postCounts.polls}</Text>
                <Text style={styles.statLabel}>Anket</Text>
              </View>
            </View>

            

            {/* TAB BAR */}
            <View style={styles.tabBar}>
              <TabButton
                label="Gönderiler"
                icon="image-outline"
                active={activeTab === "posts"}
                onPress={() => setActiveTab("posts")}
              />
              <TabButton
                label="Dosyalar"
                icon="document-outline"
                active={activeTab === "files"}
                onPress={() => setActiveTab("files")}
              />
              <TabButton
                label="Notlar"
                icon="document-text-outline"
                active={activeTab === "notes"}
                onPress={() => setActiveTab("notes")}
              />
              <TabButton
                label="Anketler"
                icon="bar-chart-outline"
                active={activeTab === "polls"}
                onPress={() => setActiveTab("polls")}
              />
            </View>

            {/* Grid üst boşluk */}
            <View style={{ height: 10 }} />
          </>
        }
        renderItem={({ item, index }) => (
          <GridItem post={item} onPress={openPostDetail} index={index} />
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <LinearGradient
                  colors={["#f0f4ff", "#e0e7ff"]}
                  style={styles.emptyIconGradient}
                >
                  <Ionicons name="images-outline" size={48} color="#667eea" />
                </LinearGradient>
              </View>

              <Text style={styles.emptyTitle}>Henüz içerik yok</Text>
              <Text style={styles.emptyText}>
                Bu sekmede görüntülenecek içerik bulunmuyor.
              </Text>
            </View>
          ) : null
        }
      />

      {/* POST DETAIL MODAL */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeModal}
          />

          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScroll}
            >
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
                <PollDetail
                  post={selectedPost}
                  formatDate={formatDate}
                  onVote={handleVote}
                />
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.actionBtnShare} activeOpacity={0.8}>
                  <LinearGradient
                    colors={["#667eea", "#764ba2"]}
                    style={styles.actionBtnGrad}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="share-social-outline" size={20} color="#fff" />
                    <Text style={styles.actionTextWhite}>Paylaş</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.closeBtn} onPress={closeModal}>
              <View style={styles.closeBtnInner}>
                <Ionicons name="close" size={22} color="#64748b" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ------------------------- TAB BUTTON ------------------------- */
const TabButton = ({ label, icon, active, onPress }: any) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.tabBtn, active && styles.tabBtnActive]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={active ? "#667eea" : "#94a3b8"}
      />
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

/* ------------------------- GRID ITEM ------------------------- */
const GridItem = ({ post, onPress }: any) => (
  <TouchableOpacity
    style={styles.gridItem}
    activeOpacity={0.85}
    onPress={() => onPress(post)}
  >
    {post.type === "image" && (
      <Image source={{ uri: post.image_url }} style={styles.postImage} />
    )}

    {post.type === "note" && (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.notePost}>
        <Ionicons
          name="document-text"
          size={22}
          color="rgba(255,255,255,0.35)"
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
          <Ionicons name="document" size={36} color="#667eea" />
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
          size={26}
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
              ? post.poll_options.reduce(
                  (sum: number, opt: any) => sum + (opt.votes || 0),
                  0
                )
              : 0}{" "}
            oy
          </Text>
        </View>
      </LinearGradient>
    )}
  </TouchableOpacity>
);

/* ------------------------- DETAIL COMPONENTS ------------------------- */
const ImageDetail = ({ post, formatDate }: any) => (
  <View>
    <Image source={{ uri: post.image_url }} style={styles.detailImg} />
    {post.text ? (
      <View style={styles.detailBox}>
        <Text style={styles.detailContent}>{post.text}</Text>
      </View>
    ) : null}
    <View style={styles.detailMeta}>
      <Ionicons name="time-outline" size={16} color="#94a3b8" />
      <Text style={styles.metaText}>{formatDate(post.created_date)}</Text>
    </View>
  </View>
);

const NoteDetail = ({ post, formatDate }: any) => (
  <View>
    <View style={styles.noteHead}>
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.noteGrad}>
        <Ionicons name="document-text" size={36} color="#fff" />
        <Text style={styles.noteTitle}>Not</Text>
      </LinearGradient>
    </View>
    <View style={styles.detailBox}>
      <Text style={styles.detailNote}>{post.text}</Text>
    </View>
    <View style={styles.detailMeta}>
      <Ionicons name="time-outline" size={16} color="#94a3b8" />
      <Text style={styles.metaText}>{formatDate(post.created_date)}</Text>
    </View>
  </View>
);

const FileDetail = ({ post, formatDate }: any) => (
  <View>
    <View style={styles.fileHead}>
      <View style={styles.fileIconBig}>
        <Ionicons name="document" size={52} color="#667eea" />
      </View>
      <Text style={styles.fileNameBig}>{post.file_name}</Text>
      <View style={styles.fileChip}>
        <Text style={styles.fileChipText}>{post.file_type}</Text>
      </View>
    </View>

    {post.text ? (
      <View style={styles.detailBox}>
        <Text style={styles.detailContent}>{post.text}</Text>
      </View>
    ) : null}

    <TouchableOpacity style={styles.dlBtn} activeOpacity={0.85}>
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={styles.dlGrad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Ionicons name="cloud-download-outline" size={24} color="#fff" />
        <Text style={styles.dlText}>Dosyayı İndir</Text>
      </LinearGradient>
    </TouchableOpacity>

    <View style={styles.detailMeta}>
      <Ionicons name="time-outline" size={16} color="#94a3b8" />
      <Text style={styles.metaText}>{formatDate(post.created_date)}</Text>
    </View>
  </View>
);

const PollDetail = ({ post, formatDate, onVote }: any) => {
  const pollOptions = Array.isArray(post.poll_options) ? post.poll_options : [];
  const totalVotes = pollOptions.reduce(
    (sum: number, opt: any) => sum + (opt.votes || 0),
    0
  );
  const maxVotes = Math.max(...pollOptions.map((o: any) => o.votes || 0), 0);

  const currentUserId = auth.currentUser?.uid;
  const userVote = post.voted_user_ids?.find(
    (v: any) => v.user_id === currentUserId
  );
  const votedIndex = userVote ? Number(userVote.option_id) : null;

  return (
    <View>
      <View style={styles.pollHead}>
        <LinearGradient colors={["#f59e0b", "#f97316"]} style={styles.pollGrad}>
          <Ionicons name="bar-chart" size={36} color="#fff" />
          <Text style={styles.pollQuestion}>{post.text}</Text>
        </LinearGradient>
      </View>

      <View style={styles.pollStatsRow}>
        <View style={styles.statBox}>
          <Ionicons name="people" size={22} color="#667eea" />
          <Text style={styles.statNum}>{totalVotes}</Text>
          <Text style={styles.statLbl}>Oy</Text>
        </View>
        <View style={styles.statDivSmall} />
        <View style={styles.statBox}>
          <Ionicons name="list" size={22} color="#f59e0b" />
          <Text style={styles.statNum}>{pollOptions.length}</Text>
          <Text style={styles.statLbl}>Seçenek</Text>
        </View>
      </View>

      <View style={styles.optionsBox}>
        {pollOptions.map((opt: any, index: number) => {
          const percent =
            totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
          const isTop = opt.votes === maxVotes && maxVotes > 0;
          const isSelected = votedIndex === index;

          return (
            <TouchableOpacity
              key={index}
              onPress={() => onVote(index)}
              style={[styles.optCard, isSelected && styles.optSelected]}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.optBar,
                  { width: `${percent}%` },
                  isTop && styles.optBarTop,
                ]}
              />
              <View style={styles.optRow}>
                <View style={styles.optLeft}>
                  <View style={[styles.optDot, isSelected && styles.optDotActive]}>
                    {isSelected && <View style={styles.optDotIn} />}
                  </View>
                  <Text style={styles.optLabel}>{opt.text}</Text>
                </View>
                <View style={styles.optRight}>
                  <Text style={styles.optPercent}>{percent}%</Text>
                  <Text style={styles.optVotes}>({opt.votes || 0})</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.detailMeta}>
        <Ionicons name="time-outline" size={16} color="#94a3b8" />
        <Text style={styles.metaText}>{formatDate(post.created_date)}</Text>
      </View>
    </View>
  );
};

/* ------------------------- STYLES ------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },

  /* LOADING */
  loading: { flex: 1, backgroundColor: "#f5f7fa" },
  loadingContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 15,
    color: "#64748b",
    fontWeight: "500",
  },

  /* TOP HEADER */
  topHeader: {
    paddingBottom: 34,
    alignItems: "center",
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  topHeaderBar: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },

  avatarBlock: { marginTop: 10, marginBottom: 10 },
  avatarOuter: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBig: { width: 98, height: 98, borderRadius: 49 },

  verifyBadge: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  usernameBig: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 6,
  },
  subText: {
    color: "#e0e7ff",
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 18,
  },
  subTextLight: {
    color: "#c7d2fe",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 18,
  },

  /* STATS CARD */
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 18,
    marginTop: -22,
    borderRadius: 18,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#667eea",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 6,
  },

  /* ACTION ROW */
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
    marginHorizontal: 18,
  },
  editBtn: { flex: 1, borderRadius: 16, overflow: "hidden" },
  editBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    gap: 8,
  },
  editBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  shareBtn: {
    width: 52,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  /* TAB BAR */
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 18,
    marginTop: 14,
    borderRadius: 16,
    padding: 6,
  },
  tabBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBtnActive: { backgroundColor: "#eef2ff" },
  tabText: { fontSize: 12, fontWeight: "700", color: "#94a3b8" },
  tabTextActive: { color: "#667eea" },

  /* GRID */
  gridContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
    marginRight: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  postImage: { width: "100%", height: "100%", resizeMode: "cover" },

  notePost: { flex: 1, padding: 12, justifyContent: "space-between" },
  pollPost: { flex: 1, padding: 12, justifyContent: "space-between" },

  gridIcon: { alignSelf: "flex-end", marginBottom: 8 },
  gridNoteText: {
    color: "#fff",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    flex: 1,
  },
  gridPollText: {
    color: "#fff",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "800",
    flex: 1,
  },

  filePost: {
    flex: 1,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  fileIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  fileName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
  },

  pollBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    alignSelf: "flex-start",
  },
  pollBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },

  /* EMPTY */
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: { marginBottom: 20 },
  emptyIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 8,
  },
  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },

  /* MODAL */
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.88,
    paddingTop: 12,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#cbd5e1",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalScroll: { paddingBottom: 24 },
  closeBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 10,
  },
  closeBtnInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(248, 250, 252, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  /* DETAIL */
  detailImg: { width: "100%", height: 320, resizeMode: "cover" },
  detailBox: { paddingHorizontal: 20, paddingVertical: 16 },
  detailContent: { fontSize: 15, color: "#1e293b", lineHeight: 22 },
  detailNote: { fontSize: 16, color: "#1e293b", lineHeight: 24 },

  detailMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#f8fafc",
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 12,
  },
  metaText: { fontSize: 13, color: "#64748b", fontWeight: "600" },

  noteHead: { marginBottom: 16 },
  noteGrad: {
    paddingVertical: 32,
    alignItems: "center",
    gap: 12,
  },
  noteTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },

  fileHead: {
    paddingVertical: 32,
    alignItems: "center",
    backgroundColor: "#f8fafc",
    marginBottom: 16,
  },
  fileIconBig: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  fileNameBig: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1e293b",
    textAlign: "center",
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  fileChip: {
    backgroundColor: "#e0e7ff",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  fileChipText: { fontSize: 12, fontWeight: "700", color: "#667eea" },

  dlBtn: {
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 14,
    overflow: "hidden",
  },
  dlGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 10,
  },
  dlText: { color: "#fff", fontSize: 15, fontWeight: "800" },

  pollHead: { marginBottom: 16 },
  pollGrad: {
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 12,
  },
  pollQuestion: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    lineHeight: 24,
  },

  pollStatsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    gap: 20,
  },
  statBox: { flex: 1, alignItems: "center", gap: 6 },
  statDivSmall: { width: 1, backgroundColor: "#e2e8f0" },
  statNum: { fontSize: 20, fontWeight: "900", color: "#1e293b" },
  statLbl: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "700",
    textTransform: "uppercase",
  },

  optionsBox: { paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  optCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  optSelected: { borderColor: "#667eea", backgroundColor: "#f0f4ff" },
  optBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#dbeafe",
    borderRadius: 12,
  },
  optBarTop: { backgroundColor: "#bfdbfe" },
  optRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  optLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  optDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  optDotActive: { borderColor: "#667eea" },
  optDotIn: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#667eea",
  },
  optLabel: { flex: 1, fontSize: 14, fontWeight: "700", color: "#1e293b" },
  optRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  optPercent: { fontSize: 15, fontWeight: "900", color: "#667eea" },
  optVotes: { fontSize: 12, color: "#94a3b8", fontWeight: "700" },

  modalActions: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    marginTop: 8,
  },
  actionBtnShare: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  actionBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  actionTextWhite: { fontSize: 15, fontWeight: "800", color: "#fff" },
});
