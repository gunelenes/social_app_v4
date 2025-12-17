import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useEffect, useLayoutEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function ListingsFeedScreen({ navigation }: any) {
  const [listings, setListings] = useState<any[]>([]);

  /* =========================
     HEADER
  ========================= */
  useLayoutEffect(() => {
    navigation.setOptions({
      title: "İlanlar",
    });
  }, []);

  /* =========================
     FETCH LISTINGS
  ========================= */
  useEffect(() => {
    const q = query(
      collection(db, "listings"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snap) => {
      setListings(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* USER */}
            <Text style={styles.username}>@{item.username}</Text>

            {/* SHORT TEXT */}
            <Text style={styles.shortText}>{item.shortText}</Text>

            {/* IMAGE SLIDER */}
            <FlatList
              data={item.images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item: img }) => (
                <Image source={{ uri: img }} style={styles.image} />
              )}
            />

            {/* DETAIL */}
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("ListingDetail", {
                  listing: item,
                })
              }
            >
              <Text style={styles.detail}>Detayına git →</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      {/* =========================
          ➕ ADD LISTING FAB
      ========================= */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CreateListing")}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
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

  card: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  username: {
    fontWeight: "600",
    marginBottom: 6,
  },

  shortText: {
    marginBottom: 8,
  },

  image: {
    width: 300,
    height: 220,
    borderRadius: 12,
    marginRight: 10,
  },

  detail: {
    marginTop: 10,
    color: "#667eea",
    fontWeight: "600",
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#667eea",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
});
