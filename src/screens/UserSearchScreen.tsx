import { useEffect, useState } from "react";
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

export default function UserSearchScreen({ navigation }: any) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const currentUserId = auth.currentUser?.uid;

  /* =========================
     👤 USERS FETCH (ONCE)
  ========================= */
  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((u) => u.id !== currentUserId);

      setUsers(list);
    };

    fetchUsers();
  }, [currentUserId]);

  /* =========================
     🔎 SEARCH FILTER
  ========================= */
  const filteredUsers = users.filter((u) =>
    u.username
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* SEARCH */}
      <TextInput
        placeholder="Kullanıcı ara..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchInput}
        placeholderTextColor="#999"
      />

      {/* LIST */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userRow}
            onPress={() =>
              navigation.navigate("Chat", {
                otherUserId: item.id,
                otherUsername: item.username ?? "Kullanıcı",
              })
            }
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.username?.[0]?.toUpperCase()}
              </Text>
            </View>

            <View>
              <Text style={styles.username}>
                @{item.username}
              </Text>
              <Text style={styles.sub}>
                Mesaj gönder
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Kullanıcı bulunamadı
          </Text>
        }
      />
    </View>
  );
}


/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },

  searchInput: {
    backgroundColor: "#f1f1f5",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
    gap: 12,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#667eea",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  username: {
    fontWeight: "600",
    fontSize: 15,
  },

  sub: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },

  empty: {
    marginTop: 40,
    textAlign: "center",
    color: "#999",
  },
});
