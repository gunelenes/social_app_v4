import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getHomeFeedPosts } from "../firebase/posts";

export default function FeedScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHomeFeedPosts()
      .then(setPosts)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <Text>Yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  if (!posts.length) {
    return (
      <SafeAreaView style={styles.loading}>
        <Text>Henüz paylaşım yok 👀</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.username}>@{item.username}</Text>

            {item.type === "note" && (
              <Text style={styles.text}>{item.text}</Text>
            )}

            {item.type === "image" && (
              <>
                {item.text ? (
                  <Text style={styles.text}>{item.text}</Text>
                ) : null}

                <Image
                  source={{ uri: item.image_url }}
                  style={styles.image}
                />
              </>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  username: {
    fontWeight: "700",
    color: "#667eea",
    marginBottom: 6,
  },

  text: {
    fontSize: 15,
    color: "#1a1a1a",
    marginBottom: 10,
    lineHeight: 22,
  },

  image: {
    width: "100%",
    height: 280,
    borderRadius: 14,
  },
});
