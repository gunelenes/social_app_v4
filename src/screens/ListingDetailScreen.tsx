import { useLayoutEffect } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../firebase/firebaseConfig";
import { deleteDoc, doc } from "firebase/firestore";
import { ensureDirectChat } from "../services/chat";
import { Ionicons } from "@expo/vector-icons";

export default function ListingDetailScreen({ route, navigation }: any) {
  const { listing } = route.params;
  const currentUid = auth.currentUser?.uid;

  const isOwner = currentUid === listing.userId;

  /* =========================
     HEADER
  ========================= */
  useLayoutEffect(() => {
    navigation.setOptions({
      title: "İlan Detayı",
    });
  }, []);

  /* =========================
     🗑️ DELETE
  ========================= */
  const onDelete = async () => {
    Alert.alert(
      "İlanı Sil",
      "Bu ilan kalıcı olarak silinecek. Emin misin?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "listings", listing.id));
              navigation.goBack();
            } catch {
              Alert.alert("Hata", "İlan silinemedi");
            }
          },
        },
      ]
    );
  };

  /* =========================
     💬 MESSAGE SELLER
  ========================= */
  const onMessageSeller = async () => {
    if (!currentUid) return;

    try {
      const res = await ensureDirectChat({
        currentUid,
        otherUid: listing.userId,
        otherUsername: listing.username,
      });

      navigation.navigate("Chat", {
        chatId: res.chatId,
        otherUserId: listing.userId,
        otherUsername: listing.username,
      });
    } catch {
      Alert.alert("Hata", "Mesaj başlatılamadı");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* =========================
          IMAGE SLIDER
      ========================= */}
      <FlatList
        data={listing.images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={styles.image} />
        )}
      />

      {/* =========================
          CONTENT
      ========================= */}
      <View style={styles.content}>
        {/* USER */}
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {listing.username?.[0]?.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.username}>@{listing.username}</Text>
        </View>

        {/* SHORT */}
        <Text style={styles.shortText}>{listing.shortText}</Text>

        {/* LONG */}
        {listing.longText ? (
          <Text style={styles.longText}>{listing.longText}</Text>
        ) : null}

        {/* =========================
            ACTIONS
        ========================= */}
        {!isOwner && (
          <TouchableOpacity
            style={styles.messageBtn}
            onPress={onMessageSeller}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
            <Text style={styles.messageText}>
              Satıcıya Mesaj At
            </Text>
          </TouchableOpacity>
        )}

        {isOwner && (
          <>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() =>
                navigation.navigate("EditListing", { listing })
              }
            >
              <Ionicons name="create-outline" size={18} color="#667eea" />
              <Text style={styles.editText}>İlanı Düzenle</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onDelete}>
              <Text style={styles.deleteText}>İlanı Sil</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
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

  image: {
    width: 360,
    height: 280,
  },

  content: {
    padding: 16,
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#667eea",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  username: {
    fontWeight: "600",
    fontSize: 15,
  },

  shortText: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
  },

  longText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 20,
  },

  messageBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#667eea",
    padding: 14,
    borderRadius: 12,
    justifyContent: "center",
    marginTop: 10,
  },

  messageText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 8,
  },

  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#667eea",
    padding: 12,
    borderRadius: 12,
    justifyContent: "center",
    marginTop: 10,
  },

  editText: {
    color: "#667eea",
    fontWeight: "700",
    marginLeft: 6,
  },

  deleteText: {
    color: "red",
    marginTop: 14,
    textAlign: "center",
    fontWeight: "600",
  },
});
