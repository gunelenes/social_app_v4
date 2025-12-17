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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../firebase/firebaseConfig";
import { ensureDirectChat, setTyping } from "../services/chat";
import {
  ChatMessage,
  sendTextMessage,
  subscribeMessages,
} from "../services/messages";

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

  /* =========================
     HEADER
  ========================= */
  useLayoutEffect(() => {
    navigation.setOptions({
      title: otherUsername ?? "Sohbet",
    });
  }, [otherUsername]);

  /* =========================
     CHAT ID HAZIRLA
  ========================= */
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

  /* =========================
     MESAJLARI DİNLE
  ========================= */
  useEffect(() => {
    if (!chatId) return;
    const unsub = subscribeMessages(chatId, setMessages);
    return unsub;
  }, [chatId]);

  /* =========================
     TYPING (OPTIMIZED)
  ========================= */
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

  /* =========================
     GÖNDER
  ========================= */
  const onSend = async () => {
    if (!text.trim()) return;

    if (!chatId || !currentUser || !otherUserId) {
      Alert.alert("Hata", "Sohbet hazır değil");
      return;
    }

    const toSend = text;
    setText("");

    try {
      await sendTextMessage({
        chatId,
        text: toSend,
        senderId: currentUser.uid,
        receiverId: otherUserId,
      });

      // typing kapat
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          data={messages}
          inverted
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const mine = item.senderId === currentUser?.uid;
            return (
              <View
                style={[
                  styles.bubble,
                  mine ? styles.mine : styles.theirs,
                ]}
              >
                <Text
                  style={[
                    styles.text,
                    mine && { color: "#fff" },
                  ]}
                >
                  {item.text}
                </Text>
              </View>
            );
          }}
        />

        {/* INPUT */}
        <View style={styles.inputRow}>
          <TextInput
            value={text}
            onChangeText={onChangeText}
            placeholder="Mesaj yaz..."
            placeholderTextColor="#999"
            style={styles.input}
          />
          <TouchableOpacity
            onPress={onSend}
            disabled={!text.trim()}
          >
            <Text
              style={[
                styles.send,
                !text.trim() && { opacity: 0.4 },
              ]}
            >
              Gönder
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  bubble: {
    maxWidth: "78%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  mine: {
    alignSelf: "flex-end",
    backgroundColor: "#667eea",
  },
  theirs: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f1f5",
  },
  text: {
    fontSize: 15,
    color: "#111",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  input: {
    flex: 1,
    backgroundColor: "#f1f1f5",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    color: "#111",
  },
  send: {
    marginLeft: 12,
    fontWeight: "800",
    color: "#667eea",
  },
});
