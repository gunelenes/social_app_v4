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
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import * as ImagePicker from "expo-image-picker";

import { auth, db, storage } from "../firebase/firebaseConfig";
import { subscribeMyProfilePosts, votePollSingleChoice } from "../firebase/posts";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

type TabType = "posts" | "files" | "notes" | "polls";

const { width, height } = Dimensions.get("window");
const GRID_ITEM_SIZE = (width - 52) / 3;

export default function ProfileScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Profile user data (Firestore)
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileUsername, setProfileUsername] = useState("");
  const [profileFaculty, setProfileFaculty] = useState("Dokuz Eylül Üniversitesi");
  const [profileBio, setProfileBio] = useState("DEÜ Öğrencisi 🎓");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

  // Edit modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [pickingPhoto, setPickingPhoto] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, []);

  // Subscribe my posts
  useEffect(() => {
    const unsubscribe = subscribeMyProfilePosts(setPosts);
    return unsubscribe;
  }, []);

  // Load my user profile (Firestore: users/{uid})
  useEffect(() => {
    const loadProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        setProfileLoading(false);
        return;
      }

      try {
        setProfileLoading(true);
        const fallbackUsername = user.email?.split("@")[0] ?? "";
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            createdAt: serverTimestamp(),
            username: fallbackUsername,
            faculty: "Dokuz Eylül Üniversitesi",
            bio: "DEÜ Öğrencisi 🎓",
            photo_url: "",
          });
          setProfileUsername(fallbackUsername);
          setProfileFaculty("Dokuz Eylül Üniversitesi");
          setProfileBio("DEÜ Öğrencisi 🎓");
          setProfilePhotoUrl(null);
        } else {
          const data: any = snap.data();
          setProfileUsername(data.username ?? fallbackUsername);
          setProfileFaculty(data.faculty ?? "Dokuz Eylül Üniversitesi");
          setProfileBio(data.bio ?? "DEÜ Öğrencisi 🎓");
          const photo = (data.photo_url ?? "").trim();
          setProfilePhotoUrl(photo.length ? photo : null);
        }
      } catch (e: any) {
        console.log("Profile load error:", e?.message);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, []);

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
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleVote = async (optionIndex: number) => {
    if (!selectedPost) return;
    await votePollSingleChoice(selectedPost.id, optionIndex);
  };

  const openEditProfile = () => {
    setEditBio(profileBio);
    setEditPhotoUrl(profilePhotoUrl);
    setEditModalVisible(true);
  };

  const pickAndUploadAvatar = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      setPickingPhoto(true);

      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("İzin gerekli", "Galeri izni vermen gerekiyor.");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      const resp = await fetch(asset.uri);
      const blob = await resp.blob();

      const fileName = `avatar_${Date.now()}.jpg`;
      const storagePath = `images/${user.uid}/avatar.jpg`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, blob, {
        contentType: "image/jpeg",
      });

      const url = await getDownloadURL(storageRef);
      setEditPhotoUrl(url);

    } catch (e: any) {
      console.log("Avatar upload error:", e?.message);
      Alert.alert("Hata", "Fotoğraf yüklenemedi. Tekrar dene.");
    } finally {
      setPickingPhoto(false);
    }
  };

  const saveProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      setSavingProfile(true);

      const userRef = doc(db, "users", user.uid);

      await updateDoc(userRef, {
        bio: (editBio ?? "").trim(),
        photo_url: editPhotoUrl ?? "",
      });

      setProfileBio((editBio ?? "").trim() || "DEÜ Öğrencisi 🎓");
      setProfilePhotoUrl(editPhotoUrl ?? null);

      setEditModalVisible(false);
      Keyboard.dismiss();
    } catch (e: any) {
      console.log("Save profile error:", e?.message);

      try {
        const fallbackUsername = user.email?.split("@")[0] ?? "";
        await setDoc(
          doc(db, "users", user.uid),
          {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            createdAt: serverTimestamp(),
            username: profileUsername || fallbackUsername,
            faculty: profileFaculty || "Dokuz Eylül Üniversitesi",
            bio: (editBio ?? "").trim(),
            photo_url: editPhotoUrl ?? "",
          },
          { merge: true }
        );
        setProfileBio((editBio ?? "").trim() || "DEÜ Öğrencisi 🎓");
        setProfilePhotoUrl(editPhotoUrl ?? null);
        setEditModalVisible(false);
        Keyboard.dismiss();
      } catch {
        Alert.alert("Hata", "Profil kaydedilemedi. Tekrar dene.");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const avatarUri = profilePhotoUrl ?? "https://i.pravatar.cc/150?img=3";

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
                    <Image source={{ uri: avatarUri }} style={styles.avatar} />
                  </View>
                </LinearGradient>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={28} color="#10b981" />
                </View>
              </View>

              {profileLoading ? (
                <View style={{ marginTop: 8 }}>
                  <ActivityIndicator color="#fff" />
                </View>
              ) : (
                <>
                  <Text style={styles.username}>@{profileUsername}</Text>
                  <Text style={styles.userBio}>
                    {(profileBio && profileBio.trim().length > 0)
                      ? profileBio
                      : "DEÜ Öğrencisi 🎓"}
                    {"  "}
                    <Text style={{ opacity: 0.85 }}>• {profileFaculty}</Text>
                  </Text>
                </>
              )}
            </View>
          </SafeAreaView>
        </LinearGradient>

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

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.editButton}
            activeOpacity={0.8}
            onPress={openEditProfile}
          >
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

      {/* POST DETAIL MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
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
                <TouchableOpacity style={styles.actionBtnShare} activeOpacity={0.7}>
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

                <TouchableOpacity style={styles.actionBtnDanger} activeOpacity={0.7}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  <Text style={styles.actionTextDanger}>Sil</Text>
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

      {/* EDIT PROFILE MODAL - KLAVYE SORUNLARI DÜZELTİLDİ */}
      <Modal
        animationType="slide"
        transparent
        visible={editModalVisible}
        onRequestClose={() => {
          Keyboard.dismiss();
          setEditModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.editOverlay}>
              <TouchableOpacity
                style={styles.editBackdrop}
                activeOpacity={1}
                onPress={() => {
                  Keyboard.dismiss();
                  setEditModalVisible(false);
                }}
              />
              <TouchableWithoutFeedback>
                <View style={styles.editContent}>
                  <View style={styles.editHeader}>
                    <Text style={styles.editTitle}>Profili Düzenle</Text>
                    <TouchableOpacity
                      style={styles.editClose}
                      onPress={() => setEditModalVisible(false)}
                    >
                      <Ionicons name="close" size={22} color="#64748b" />
                    </TouchableOpacity>
                  </View>

                  {/* Avatar */}
                  <TouchableOpacity
                    style={styles.editAvatarWrap}
                    activeOpacity={0.8}
                    onPress={pickAndUploadAvatar}
                    disabled={pickingPhoto}
                  >
                    <Image
                      source={{
                        uri: editPhotoUrl ?? "https://i.pravatar.cc/150?img=3",
                      }}
                      style={styles.editAvatar}
                    />
                    <View style={styles.editAvatarBadge}>
                      {pickingPhoto ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Ionicons name="camera" size={16} color="#fff" />
                      )}
                    </View>
                  </TouchableOpacity>

                  <Text style={styles.editHint}>Fotoğrafı değiştirmek için dokun</Text>

                  {/* Immutable fields */}
                  <View style={styles.readOnlyCard}>
                    <View style={styles.readOnlyRow}>
                      <Ionicons name="person-circle-outline" size={20} color="#667eea" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.readOnlyLabel}>Kullanıcı Adı (Sabit)</Text>
                        <Text style={styles.readOnlyValue}>@{profileUsername}</Text>
                      </View>
                    </View>

                    <View style={styles.readOnlyDivider} />

                    <View style={styles.readOnlyRow}>
                      <Ionicons name="school-outline" size={20} color="#667eea" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.readOnlyLabel}>Fakülte (Sabit)</Text>
                        <Text style={styles.readOnlyValue}>{profileFaculty}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Bio editable */}
                  <Text style={styles.inputLabel2}>Kısa Açıklama</Text>
                  <TextInput
                    value={editBio}
                    onChangeText={setEditBio}
                    placeholder="Kendin hakkında kısa bir şey yaz…"
                    placeholderTextColor="#94a3b8"
                    maxLength={120}
                    multiline
                    blurOnSubmit={false}
                    style={styles.bioInput2}
                  />
                  <Text style={styles.counter}>{(editBio ?? "").length}/120</Text>

                  <View style={styles.editActions2}>
                    <TouchableOpacity
                      style={styles.cancelBtn2}
                      onPress={() => setEditModalVisible(false)}
                      disabled={savingProfile}
                    >
                      <Text style={styles.cancelText2}>İptal</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.saveBtn2, savingProfile && { opacity: 0.7 }]}
                      onPress={saveProfile}
                      disabled={savingProfile}
                      activeOpacity={0.85}
                    >
                      {savingProfile ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={18} color="#fff" />
                          <Text style={styles.saveText2}>Kaydet</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// Grid Item ve diğer componentler aynı kalıyor...
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

const ImageDetail = ({ post, formatDate }: any) => (
  <View>
    <Image source={{ uri: post.image_url }} style={styles.detailImg} />
    {post.text && (
      <View style={styles.detailBox}>
        <Text style={styles.detailContent}>{post.text}</Text>
      </View>
    )}
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

    {post.text && (
      <View style={styles.detailBox}>
        <Text style={styles.detailContent}>{post.text}</Text>
      </View>
    )}

    <TouchableOpacity style={styles.dlBtn} activeOpacity={0.7}>
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
  const userVote = post.voted_user_ids?.find((v: any) => v.user_id === currentUserId);
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
              activeOpacity={0.7}
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
                  <Text style={styles.optVotes}>({opt.votes})</Text>
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
  username: { fontSize: 24, fontWeight: "700", color: "#fff", marginBottom: 4 },
  userBio: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
    textAlign: "center",
    paddingHorizontal: 20,
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
  statItem: { flex: 1, alignItems: "center" },
  statNumber: { fontSize: 24, fontWeight: "700", color: "#667eea", marginBottom: 4 },
  statLabel: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  statDivider: { width: 1, backgroundColor: "#e2e8f0", marginHorizontal: 8 },
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
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: { marginBottom: 24 },
  emptyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#1e293b", marginBottom: 8 },
  emptyText: { fontSize: 15, color: "#64748b", textAlign: "center" },
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
  postImage: { width: "100%", height: "100%", resizeMode: "cover" },
  notePost: { flex: 1, padding: 12, justifyContent: "space-between" },
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
  fileName: { fontSize: 12, fontWeight: "600", color: "#1e293b", textAlign: "center" },
  pollPost: { flex: 1, padding: 12, justifyContent: "space-between" },
  gridIcon: { alignSelf: "flex-end", marginBottom: 8 },
  gridNoteText: { color: "#fff", fontSize: 12, lineHeight: 16, fontWeight: "500", flex: 1 },
  gridPollText: { color: "#fff", fontSize: 13, lineHeight: 17, fontWeight: "700", flex: 1 },
  pollBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    alignSelf: "flex-start",
  },
  pollBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  // MODERN POST DETAIL MODAL
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

  // DETAIL STYLES
  detailImg: { width: "100%", height: 300, resizeMode: "cover" },
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
  metaText: { fontSize: 13, color: "#64748b", fontWeight: "500" },

  noteHead: { marginBottom: 16 },
  noteGrad: {
    paddingVertical: 32,
    alignItems: "center",
    gap: 12,
  },
  noteTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },

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
    fontWeight: "700",
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
  fileChipText: { fontSize: 12, fontWeight: "600", color: "#667eea" },

  dlBtn: { marginHorizontal: 20, marginVertical: 12, borderRadius: 14, overflow: "hidden" },
  dlGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 10,
  },
  dlText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  pollHead: { marginBottom: 16 },
  pollGrad: {
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 12,
  },
  pollQuestion: {
    fontSize: 18,
    fontWeight: "700",
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
  statNum: { fontSize: 20, fontWeight: "700", color: "#1e293b" },
  statLbl: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
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
  optDotIn: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#667eea" },
  optLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: "#1e293b" },
  optRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  optPercent: { fontSize: 15, fontWeight: "700", color: "#667eea" },
  optVotes: { fontSize: 12, color: "#94a3b8", fontWeight: "500" },

  modalActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    marginTop: 8,
  },
  actionBtnShare: {
    flex: 2,
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
  actionTextWhite: { fontSize: 15, fontWeight: "700", color: "#fff" },
  actionBtnDanger: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    gap: 6,
    borderWidth: 1.5,
    borderColor: "#fee2e2",
  },
  actionTextDanger: { fontSize: 15, fontWeight: "600", color: "#ef4444" },

  // ===== EDIT PROFILE MODAL STYLES =====
  editOverlay: { flex: 1, justifyContent: "flex-end" },
  editBackdrop: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  editContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
    maxHeight: height * 0.92,
  },
  editHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  editTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  editClose: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  editAvatarWrap: {
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  editAvatar: { width: 116, height: 116, borderRadius: 58 },
  editAvatarBadge: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#667eea",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  editHint: {
    textAlign: "center",
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 12,
  },
  readOnlyCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
  },
  readOnlyRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  readOnlyLabel: { fontSize: 12, color: "#64748b", fontWeight: "700" },
  readOnlyValue: { fontSize: 15, color: "#0f172a", fontWeight: "800", marginTop: 2 },
  readOnlyDivider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 12 },

  inputLabel2: { fontSize: 12, color: "#64748b", fontWeight: "700", marginBottom: 8 },
  bioInput2: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 12,
    minHeight: 86,
    textAlignVertical: "top",
    color: "#0f172a",
    fontWeight: "600",
  },
  counter: { textAlign: "right", color: "#94a3b8", fontWeight: "700", marginTop: 6 },

  editActions2: { flexDirection: "row", gap: 12, marginTop: 14 },
  cancelBtn2: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cancelText2: { color: "#0f172a", fontWeight: "800" },
  saveBtn2: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#667eea",
  },
  saveText2: { color: "#fff", fontWeight: "900" },
});
