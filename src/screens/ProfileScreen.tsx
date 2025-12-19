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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../firebase/firebaseConfig";
import { subscribeMyProfilePosts } from "../firebase/posts";
import { Ionicons } from "@expo/vector-icons";

type TabType = "posts" | "files" | "notes" | "polls";

const { width } = Dimensions.get("window");
const GRID_ITEM_SIZE = (width - 52) / 3;

export default function ProfileScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [posts, setPosts] = useState<any[]>([]);

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
            {/* Settings Button */}
            <View style={styles.headerTop}>
              <View style={{ width: 40 }} />
              <Text style={styles.headerTitle}>Profil</Text>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => {}}
              >
                <Ionicons name="settings-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Avatar Section */}
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
              style={[
                styles.tab,
                activeTab === tab.key && styles.tabActive,
              ]}
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
              <TouchableOpacity
                key={post.id}
                style={styles.gridItem}
                activeOpacity={0.8}
              >
                {/* IMAGE */}
                {post.type === "image" && (
                  <Image
                    source={{ uri: post.image_url }}
                    style={styles.postImage}
                  />
                )}

                {/* NOTE */}
                {post.type === "note" && (
                  <LinearGradient
                    colors={["#667eea", "#764ba2"]}
                    style={styles.notePost}
                  >
                    <View style={styles.noteContent}>
                      <Ionicons
                        name="document-text"
                        size={24}
                        color="rgba(255,255,255,0.3)"
                        style={styles.noteIconSmall}
                      />
                      <Text numberOfLines={5} style={styles.noteText}>
                        {post.text}
                      </Text>
                      <View style={styles.noteFooter}>
                        <Ionicons name="calendar-outline" size={10} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.noteDate}>
                          {post.created_date?.toDate
                            ? new Date(post.created_date.toDate()).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
                            : ''}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                )}

                {/* FILE */}
                {post.type === "file" && (
                  <View style={styles.filePost}>
                    <View style={styles.fileIconContainer}>
                      <Ionicons name="document" size={40} color="#667eea" />
                    </View>
                    <Text numberOfLines={2} style={styles.fileName}>
                      {post.file_name}
                    </Text>
                    <Text style={styles.fileType}>{post.file_type}</Text>
                  </View>
                )}

                {/* POLL */}
                {post.type === "poll" && (
                  <LinearGradient
                    colors={["#f59e0b", "#f97316"]}
                    style={styles.pollPost}
                  >
                    <View style={styles.pollContent}>
                      <Ionicons
                        name="bar-chart"
                        size={28}
                        color="rgba(255,255,255,0.4)"
                        style={styles.pollIconLarge}
                      />
                      <Text numberOfLines={3} style={styles.pollQuestion}>
                        {post.text}
                      </Text>
                      <View style={styles.pollStats}>
                        <View style={styles.pollStatItem}>
                          <Ionicons name="people" size={12} color="#fff" />
                          <Text style={styles.pollStatText}>
                            {Array.isArray(post.poll_options)
                              ? post.poll_options.reduce((sum: number, opt: any) => sum + (opt.votes || 0), 0)
                              : 0}
                          </Text>
                        </View>
                        <View style={styles.pollStatItem}>
                          <Ionicons name="options" size={12} color="#fff" />
                          <Text style={styles.pollStatText}>
                            {Array.isArray(post.poll_options) ? post.poll_options.length : 0} seçenek
                          </Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },

  headerGradient: {
    paddingBottom: 40,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 20,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },

  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarSection: {
    alignItems: "center",
    paddingBottom: 20,
  },

  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },

  avatarRing: {
    padding: 6,
    borderRadius: 68,
  },

  avatarWrapper: {
    borderRadius: 62,
    overflow: "hidden",
  },

  avatar: {
    width: 124,
    height: 124,
    borderWidth: 4,
    borderColor: "#fff",
    borderRadius: 62,
  },

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

  username: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },

  userBio: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },

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

  statItem: {
    flex: 1,
    alignItems: "center",
  },

  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#667eea",
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },

  statDivider: {
    width: 1,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 8,
  },

  actionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },

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

  editButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

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

  tabActive: {
    backgroundColor: "#f0f4ff",
  },

  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
  },

  tabTextActive: {
    color: "#667eea",
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },

  emptyIconContainer: {
    marginBottom: 24,
  },

  emptyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    paddingTop: 20,
    justifyContent: "space-between",
  },

  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f8fafc",
    marginBottom: 8,
  },

  postImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  notePost: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },

  noteContent: {
    flex: 1,
    justifyContent: "space-between",
  },

  noteIconSmall: {
    alignSelf: "flex-end",
    marginBottom: 8,
  },

  noteText: {
    color: "#fff",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    flex: 1,
  },

  noteFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },

  noteDate: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 9,
    fontWeight: "600",
  },

  filePost: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },

  fileIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  fileName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 4,
  },

  fileType: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "500",
  },

  pollPost: {
    flex: 1,
    padding: 12,
  },

  pollContent: {
    flex: 1,
    justifyContent: "space-between",
  },

  pollIconLarge: {
    alignSelf: "flex-end",
    marginBottom: 8,
  },

  pollQuestion: {
    color: "#fff",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
    flex: 1,
  },

  pollStats: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },

  pollStatItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },

  pollStatText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});