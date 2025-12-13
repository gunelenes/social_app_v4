import { View, Text, Button } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Hoşgeldin 🎉</Text>
      <Button title="Çıkış Yap" onPress={() => signOut(auth)} />
    </View>
  );
}
