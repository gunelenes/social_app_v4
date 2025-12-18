import { useEffect, useState, useLayoutEffect } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createComment,
  subscribePostComments,
  deleteComment,
} from "../firebase/comments";
import { auth } from "../firebase/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function CommentsModal({ route, navigation }: any) {
  const { postId } = route.params;

  const [text, setText] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Yorumlar",
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
    const unsub = subscribePostComments(postId, setComments);
    return unsub;
  }, [postId]);

  const sendComment = async () => {
    if (!text.trim()) return;

    setIsSending(true);
    try {
      await createComment(postId, text.trim());
      setText("");
    } catch (error) {
      Alert.alert("Hata", "Yorum gönderilemedi");
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = (commentId: string) => {
    Alert.alert("Yorumu sil", "Bu yorumu silmek istiyor musun?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => deleteComment(postId, commentId),
      },
    ]);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Az önce";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "Az önce";
    if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
    return `${Math.floor(diff / 86400)} gün önce`;
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
      <Text style={styles.emptyTitle}>Henüz yorum yok</Text>
      <Text style={styles.emptyText}>
        İlk yorumu yapan siz olun!
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Comments List */}
        <FlatList
          data={comments}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState />}
          renderItem={({ item }) => {
            const isOwner = item.user_id === auth.currentUser?.uid;

            return (
              <View style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <View style={styles.avatarContainer}>
                    <LinearGradient
                      colors={["#667eea", "#764ba2"]}
                      style={styles.avatar}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.avatarText}>
                        {item.username?.charAt(0).toUpperCase()}
                      </Text>
                    </LinearGradient>
                  </View>

                  <View style={styles.commentInfo}>
                    <View style={styles.commentTop}>
                      <Text style={styles.username}>@{item.username}</Text>
                      {isOwner && (
                        <View style={styles.ownerBadge}>
                          <Text style={styles.ownerBadgeText}>Sen</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.timestamp}>
                      {formatDate(item.created_date)}
                    </Text>
                  </View>

                  {isOwner && (
                    <TouchableOpacity
                      onPress={() => handleDelete(item.id)}
                      style={styles.deleteButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.commentText}>{item.text}</Text>
              </View>
            );
          }}
        />

        {/* Input Section */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <View style={styles.inputBox}>
              <TextInput
                placeholder="Yorumunuzu yazın..."
                value={text}
                onChangeText={setText}
                style={styles.input}
                multiline
                maxLength={500}
                placeholderTextColor="#94a3b8"
              />
            </View>

            <TouchableOpacity
              onPress={sendComment}
              disabled={!text.trim() || isSending}
              style={[
                styles.sendButton,
                (!text.trim() || isSending) && styles.sendButtonDisabled,
              ]}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  !text.trim() || isSending
                    ? ["#cbd5e1", "#94a3b8"]
                    : ["#667eea", "#764ba2"]
                }
                style={styles.sendGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isSending ? (
                  <View style={styles.sendingSpinner} />
                ) : (
                  <Ionicons name="send" size={20} color="#fff" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {text.length > 0 && (
            <Text style={styles.charCounter}>{text.length}/500</Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },

  keyboardView: {
    flex: 1,
  },

  listContent: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
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

  commentCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  commentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  avatarContainer: {
    marginRight: 12,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

  commentInfo: {
    flex: 1,
  },

  commentTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },

  username: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
  },

  ownerBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },

  ownerBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1e40af",
  },

  timestamp: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "500",
  },

  deleteButton: {
    padding: 4,
  },

  commentText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#334155",
  },

  inputContainer: {
    backgroundColor: "#fff",
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },

  inputBox: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },

  input: {
    fontSize: 15,
    color: "#1e293b",
    lineHeight: 20,
    maxHeight: 80,
  },

  sendButton: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  sendButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 1,
  },

  sendGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  sendingSpinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderTopColor: "#fff",
  },

  charCounter: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
    textAlign: "right",
    marginTop: 6,
  },
});