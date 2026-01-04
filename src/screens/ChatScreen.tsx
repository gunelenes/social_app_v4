import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../firebase/firebaseConfig";
import { ensureDirectChat, setTyping } from "../services/chat";
import {
  ChatMessage,
  sendTextMessage,
  subscribeMessages,
} from "../services/messages";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function ChatScreen({ route, navigation }: any) {
  const currentUser = auth.currentUser;

  const {
    chatId: routeChatId,
    otherUserId,
    otherUsername,
  } = route.params ?? {};

  const [chatId, setChatId] = useState<string | null>(routeChatId ?? null);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const typingTimer = useRef<any>(null);
  const isTyping = useRef<boolean>(false);
  const flatListRef = useRef<FlatList>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: otherUsername ?? "Sohbet",
      headerBackTitle: "Mesajlar",
      headerStyle: {
        backgroundColor: "#fff",
      },
      headerTintColor: "#1e293b",
      headerTitleStyle: {
        fontWeight: "700",
      },
      headerRight: () => (
        <View style={styles.headerRight}>
          <LinearGradient
            colors={["#667eea", "#764ba2"]}
            style={styles.headerAvatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.headerAvatarText}>
              {otherUsername?.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
        </View>
      ),
    });
  }, [otherUsername]);

  useEffect(() => {
    if (!currentUser) return;

    if (routeChatId) {
      setChatId(routeChatId);
      return;
    }

    if (!otherUserId) return;

    (async () => {
      try {
        const res = await ensureDirectChat({
          currentUid: currentUser.uid,
          otherUid: otherUserId,
          otherUsername,
        });
        setChatId(res.chatId);
      } catch (e) {
        console.error("❌ ensureDirectChat error:", e);
      }
    })();
  }, [currentUser?.uid, otherUserId, routeChatId]);

  useEffect(() => {
    if (!chatId) return;
    const unsub = subscribeMessages(chatId, setMessages);
    return unsub;
  }, [chatId]);

  const onChangeText = (val: string) => {
    setText(val);

    if (!chatId || !currentUser) return;

    if (!isTyping.current) {
      isTyping.current = true;
      setTyping({
        chatId,
        uid: currentUser.uid,
        typing: true,
      });
    }

    if (typingTimer.current) clearTimeout(typingTimer.current);

    typingTimer.current = setTimeout(() => {
      isTyping.current = false;
      setTyping({
        chatId,
        uid: currentUser.uid,
        typing: false,
      });
    }, 900);
  };

  const onSend = async () => {
    if (!text.trim()) return;

    if (!chatId || !currentUser || !otherUserId) {
      Alert.alert("Hata", "Sohbet hazır değil");
      return;
    }

    const toSend = text;
    setText("");
    Keyboard.dismiss();

    try {
      await sendTextMessage({
        chatId,
        text: toSend,
        senderId: currentUser.uid,
        receiverId: otherUserId,
      });

      isTyping.current = false;
      setTyping({
        chatId,
        uid: currentUser.uid,
        typing: false,
      });
    } catch (e) {
      console.error("❌ sendTextMessage error:", e);
      Alert.alert("Hata", "Mesaj gönderilemedi");
      setText(toSend);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
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
      <Text style={styles.emptyTitle}>Henüz mesaj yok</Text>
      <Text style={styles.emptyText}>
        İlk mesajı göndererek sohbeti başlatın
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.flex}>
            <FlatList
              ref={flatListRef}
              data={messages}
              inverted
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<EmptyState />}
              renderItem={({ item }) => {
                const mine = item.senderId === currentUser?.uid;
                return (
                  <View style={styles.messageContainer}>
                    {mine ? (
                      <View style={styles.myMessageWrapper}>
                        <View style={styles.myBubble}>
                          <LinearGradient
                            colors={["#667eea", "#764ba2"]}
                            style={styles.myBubbleGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                          >
                            <Text style={styles.myMessageText}>{item.text}</Text>
                          </LinearGradient>
                        </View>
                        <Text style={styles.myMessageTime}>
                          {formatTime(item.createdAt)}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.theirMessageWrapper}>
                        <View style={styles.theirAvatar}>
                          <LinearGradient
                            colors={["#667eea", "#764ba2"]}
                            style={styles.avatarGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          >
                            <Text style={styles.avatarText}>
                              {otherUsername?.charAt(0).toUpperCase()}
                            </Text>
                          </LinearGradient>
                        </View>
                        <View style={styles.theirBubbleContainer}>
                          <View style={styles.theirBubble}>
                            <Text style={styles.theirMessageText}>{item.text}</Text>
                          </View>
                          <Text style={styles.theirMessageTime}>
                            {formatTime(item.createdAt)}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                );
              }}
            />
          </View>
        </TouchableWithoutFeedback>

        {/* Input Section */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              value={text}
              onChangeText={onChangeText}
              placeholder="Mesajınızı yazın..."
              placeholderTextColor="#94a3b8"
              style={styles.input}
              multiline
              maxLength={1000}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              onPress={onSend}
              disabled={!text.trim()}
              style={[
                styles.sendButton,
                !text.trim() && styles.sendButtonDisabled,
              ]}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  !text.trim()
                    ? ["#cbd5e1", "#94a3b8"]
                    : ["#667eea", "#764ba2"]
                }
                style={styles.sendGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
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

  flex: {
    flex: 1,
  },

  headerRight: {
    marginRight: 16,
  },

  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  headerAvatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  messagesList: {
    padding: 16,
    flexGrow: 1,
  },

  messageContainer: {
    marginBottom: 16,
  },

  myMessageWrapper: {
    alignItems: "flex-end",
  },

  myBubble: {
    maxWidth: "78%",
    borderRadius: 20,
    borderTopRightRadius: 4,
    overflow: "hidden",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  myBubbleGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  myMessageText: {
    fontSize: 15,
    lineHeight: 20,
    color: "#fff",
  },

  myMessageTime: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 4,
    marginRight: 4,
    fontWeight: "500",
  },

  theirMessageWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },

  theirAvatar: {
    marginBottom: 16,
  },

  avatarGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  theirBubbleContainer: {
    flex: 1,
  },

  theirBubble: {
    maxWidth: "90%",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  theirMessageText: {
    fontSize: 15,
    lineHeight: 20,
    color: "#1e293b",
  },

  theirMessageTime: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 4,
    marginLeft: 4,
    fontWeight: "500",
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    transform: [{ scaleY: -1 }],
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

  input: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1e293b",
    maxHeight: 100,
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
});