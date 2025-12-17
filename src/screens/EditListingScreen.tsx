import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export default function EditListingScreen({ route, navigation }: any) {
  const { listing } = route.params;

  const [shortText, setShortText] = useState(listing.shortText);
  const [longText, setLongText] = useState(listing.longText);

  const onSave = async () => {
    try {
      await updateDoc(doc(db, "listings", listing.id), {
        shortText,
        longText,
      });
      Alert.alert("Güncellendi ✅");
      navigation.goBack();
    } catch {
      Alert.alert("Hata", "Güncellenemedi");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text>Kısa Açıklama</Text>
      <TextInput
        style={styles.input}
        value={shortText}
        onChangeText={setShortText}
      />

      <Text>Uzun Açıklama</Text>
      <TextInput
        style={[styles.input, { height: 120 }]}
        value={longText}
        multiline
        onChangeText={setLongText}
      />

      <TouchableOpacity style={styles.save} onPress={onSave}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          Kaydet
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  input: {
    backgroundColor: "#f1f1f5",
    padding: 12,
    borderRadius: 10,
    marginVertical: 8,
  },
  save: {
    marginTop: 24,
    backgroundColor: "#667eea",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
});
