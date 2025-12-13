import { View, TextInput, Button, Alert, Text, TouchableOpacity } from "react-native";
import { useState } from "react";
import { register } from "../firebase/auth";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<any>;

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      await register(email, password);
      Alert.alert(
        "Başarılı",
        "Doğrulama maili gönderildi. Lütfen mailinizi kontrol edin."
      );
      navigation.navigate("Login");
    } catch (err: any) {
      Alert.alert("Hata", err.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="ogr.deu.edu.tr mail"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Şifre"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button title="Kayıt Ol" onPress={handleRegister} />

      {/* 🔁 Login geçiş */}
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={{ marginTop: 20, textAlign: "center", color: "blue" }}>
          Zaten hesabın var mı? Giriş Yap
        </Text>
      </TouchableOpacity>
    </View>
  );
}
