import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import {
  createComment,
  subscribePostComments,
  deleteComment,
} from "../firebase/comments";
import { auth } from "../firebase/firebaseConfig";

export default function CommentsModal({ route }: any) {
  const { postId } = route.params;

  const [text, setText] = useState("");
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    const unsub = subscribePostComments(postId, setComments);
    return unsub;
  }, [postId]);

  const sendComment = async () => {
    if (!text.trim()) return;

    await createComment(postId, text.trim());
    setText("");
  };

  const handleDelete = (commentId: string) => {
    Alert.alert(
      "Yorumu sil",
      "Bu yorumu silmek istiyor musun?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: () => deleteComment(postId, commentId),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={comments}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const isOwner =
            item.user_id === auth.currentUser?.uid;

          return (
            <View style={styles.comment}>
              <Text style={styles.username}>
                @{item.username}
              </Text>

              <Text style={styles.commentText}>
                {item.text}
              </Text>

              {isOwner && (
                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                >
                  <Text style={styles.delete}>
                    🗑️ Yorumu Sil
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      {/* INPUT */}
      <View style={styles.inputRow}>
        <TextInput
          placeholder="Yorum yaz..."
          value={text}
          onChangeText={setText}
          style={styles.input}
        />
        <TouchableOpacity onPress={sendComment}>
          <Text style={styles.send}>Gönder</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  comment: {
    marginBottom: 14,
  },

  username: {
    fontWeight: "700",
    color: "#667eea",
  },

  commentText: {
    marginTop: 4,
    fontSize: 15,
  },

  delete: {
    marginTop: 6,
    fontSize: 12,
    color: "red",
  },

  inputRow: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#eee",
  },

  input: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f1f1f5",
    borderRadius: 10,
  },

  send: {
    marginLeft: 12,
    alignSelf: "center",
    color: "#667eea",
    fontWeight: "700",
  },
});
