import { useEffect, useState, useLayoutEffect } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../firebase/firebaseConfig";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function UserSearchScreen({ navigation }: any) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUserId = auth.currentUser?.uid;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Kullanıcı Ara",
      headerBackTitle: "Mesajlar",
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
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, "users"));
        const list = snap.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((u) => u.id !== currentUserId);

        setUsers(list);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUserId]);

  const filteredUsers = users.filter((u) =>
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <LinearGradient
          colors={["#f0f4ff", "#e0e7ff"]}
          style={styles.emptyIconGradient}
        >
          <Ionicons
            name={search ? "search-outline" : "people-outline"}
            size={64}
            color="#667eea"
          />
        </LinearGradient>
      </View>
      <Text style={styles.emptyTitle}>
        {search ? "Kullanıcı Bulunamadı" : "Kullanıcı Ara"}
      </Text>
      <Text style={styles.emptyText}>
        {search
          ? "Aradığınız kullanıcı bulunamadı. Farklı bir isim deneyin."
          : "Mesaj göndermek için bir kullanıcı arayın"}
      </Text>
    </View>
  );

  const LoadingState = () => (
    <View style={styles.loadingState}>
      <View style={styles.loadingSpinner} />
      <Text style={styles.loadingText}>Kullanıcılar yükleniyor...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Ionicons
            name="search"
            size={20}
            color="#94a3b8"
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Kullanıcı adı ara..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch("")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {search.length > 0 && (
          <Text style={styles.resultCount}>
            {filteredUsers.length} sonuç bulundu
          </Text>
        )}
      </View>

      {/* Users List */}
      {loading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.userCard}
              onPress={() =>
                navigation.navigate("Chat", {
                  otherUserId: item.id,
                  otherUsername: item.username ?? "Kullanıcı",
                })
              }
              activeOpacity={0.7}
            >
              <View style={styles.userInfo}>
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

                <View style={styles.userDetails}>
                  <Text style={styles.username}>@{item.username}</Text>
                  <View style={styles.actionRow}>
                    <Ionicons
                      name="chatbubble-ellipses-outline"
                      size={14}
                      color="#667eea"
                    />
                    <Text style={styles.actionText}>Mesaj gönder</Text>
                  </View>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={<EmptyState />}
        />
      )}

      {/* Info Card */}
      {!loading && filteredUsers.length > 0 && (
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={18} color="#667eea" />
          <Text style={styles.infoText}>
            Kullanıcıya dokunarak mesaj gönderebilirsiniz
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },

  searchContainer: {
    backgroundColor: "#fff",
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },

  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  searchIcon: {
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1e293b",
  },

  resultCount: {
    marginTop: 8,
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },

  listContent: {
    padding: 16,
    flexGrow: 1,
  },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },

  userDetails: {
    flex: 1,
  },

  username: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  actionText: {
    fontSize: 13,
    color: "#667eea",
    fontWeight: "600",
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
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
    textAlign: "center",
  },

  emptyText: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
  },

  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },

  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#e0e7ff",
    borderTopColor: "#667eea",
    marginBottom: 16,
  },

  loadingText: {
    fontSize: 15,
    color: "#64748b",
    fontWeight: "500",
  },

  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },

  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#1e40af",
    lineHeight: 18,
  },
});