import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  subscribeHomeFeedPosts,
  votePollSingleChoice,
} from "../firebase/posts";
import { auth } from "../firebase/firebaseConfig";

export default function FeedScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeHomeFeedPosts((data) => {
      setPosts(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <Text>Yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const pollOptions = Array.isArray(item.poll_options)
            ? item.poll_options
            : [];

          const userVote = item.voted_user_ids?.find(
            (v: any) => v.user_id === auth.currentUser?.uid
          );

          const votedIndex = userVote
            ? Number(userVote.option_id)
            : null;

          const totalVotes = pollOptions.reduce(
            (s: number, o: any) => s + (o.votes || 0),
            0
          );

          const maxVotes = Math.max(
            ...pollOptions.map((o: any) => o.votes || 0),
            0
          );

          return (
            <View style={styles.card}>
              <Text style={styles.username}>@{item.username}</Text>

              {item.type === "note" && (
                <Text style={styles.text}>{item.text}</Text>
              )}

              {item.type === "image" && (
                <>
                  {!!item.text && (
                    <Text style={styles.text}>{item.text}</Text>
                  )}
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.image}
                  />
                </>
              )}

              {item.type === "file" && (
                <TouchableOpacity
                  style={styles.fileBox}
                  onPress={() => Linking.openURL(item.file_url)}
                >
                  <Text style={styles.fileIcon}>📎</Text>
                  <View>
                    <Text style={styles.fileName}>{item.file_name}</Text>
                    <Text style={styles.fileType}>{item.file_type}</Text>
                  </View>
                </TouchableOpacity>
              )}

              {item.type === "poll" && pollOptions.length > 0 && (
                <View style={styles.pollBox}>
                  <Text style={styles.pollQuestion}>{item.text}</Text>

                  {pollOptions.map((opt: any, index: number) => {
                    const percent =
                      totalVotes === 0
                        ? 0
                        : Math.round((opt.votes / totalVotes) * 100);

                    const isTop =
                      opt.votes === maxVotes && maxVotes > 0;

                    const isSelected = votedIndex === index;

                    return (
                      <TouchableOpacity
                        key={index}
                        onPress={() =>
                          votePollSingleChoice(item.id, index)
                        }
                        style={[
                          styles.pollOption,
                          isSelected && styles.selectedOption,
                        ]}
                      >
                        <View
                          style={[
                            styles.pollBar,
                            { width: `${percent}%` },
                            isTop && styles.pollBarTop,
                          ]}
                        />

                        <View style={styles.pollRow}>
                          <Text style={styles.pollText}>
                            {opt.text}
                          </Text>
                          <Text style={styles.pollVotes}>
                            {percent}% • {opt.votes}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  <Text style={styles.totalVotes}>
                    🧮 Toplam oy: {totalVotes}
                  </Text>
                </View>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    elevation: 2,
  },

  username: {
    fontWeight: "700",
    color: "#667eea",
    marginBottom: 6,
  },

  text: { fontSize: 15, marginBottom: 10 },
  image: { width: "100%", height: 280, borderRadius: 14 },

  fileBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#f1f1f5",
    borderRadius: 12,
    gap: 12,
  },

  fileIcon: { fontSize: 28 },
  fileName: { fontWeight: "600" },
  fileType: { fontSize: 12, color: "#666" },

  pollBox: { marginTop: 10, gap: 10 },
  pollQuestion: { fontWeight: "700" },

  pollOption: {
    backgroundColor: "#f1f1f5",
    borderRadius: 10,
    overflow: "hidden",
  },

  selectedOption: {
    borderWidth: 2,
    borderColor: "#667eea",
  },

  pollBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#dbeafe",
  },

  pollBarTop: {
    backgroundColor: "#a5b4fc",
  },

  pollRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
  },

  pollText: { fontWeight: "500" },
  pollVotes: { fontSize: 12, color: "#555" },

  totalVotes: {
    marginTop: 6,
    fontSize: 12,
    color: "#666",
  },
});
