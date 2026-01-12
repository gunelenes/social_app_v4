import {
  View,
  TextInput,
  Alert,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from "react-native";
import { useState } from "react";
import { register } from "../firebase/auth";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { FACULTIES } from "../constants/faculties";
import { auth } from "../firebase/firebaseConfig";
import { createUserIfNotExists } from "../firebase/user";

type Props = NativeStackScreenProps<any>;

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [faculty, setFaculty] = useState<string | null>(null);
  const [facultyModal, setFacultyModal] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const validateEmail = (email: string) =>
    email.toLowerCase().endsWith("@ogr.deu.edu.tr");

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !faculty) {
      Alert.alert("Uyarı", "Lütfen tüm alanları doldurun");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Uyarı", "@ogr.deu.edu.tr uzantılı mail kullanın");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Uyarı", "Şifre en az 6 karakter olmalı");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Uyarı", "Şifreler eşleşmiyor");
      return;
    }

    setIsLoading(true);
    try {
      await register(email.trim(), password);

      if (auth.currentUser) {
        await createUserIfNotExists(auth.currentUser, faculty);
      }

      Alert.alert(
        "Başarılı ✅",
        "Doğrulama maili gönderildi.",
        [{ text: "Tamam", onPress: () => navigation.navigate("Login") }]
      );
    } catch (err: any) {
      Alert.alert("Hata", err.message || "Kayıt başarısız");
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = () => {
    if (!password) return null;
    if (password.length < 6) return { text: "Zayıf", color: "#ef4444" };
    if (password.length < 10) return { text: "Orta", color: "#f59e0b" };
    return { text: "Güçlü", color: "#10b981" };
  };

  const strength = passwordStrength();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* HEADER */}
          <View style={styles.header}>
            <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.logo}>
              <Ionicons name="person-add" size={40} color="#fff" />
            </LinearGradient>
            <Text style={styles.title}>Hesap Oluştur 🎉</Text>
            <Text style={styles.subtitle}>DEÜ mail adresinle kayıt ol</Text>
          </View>

          {/* FORM */}
          <View style={styles.form}>
            {/* EMAIL */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>E-posta</Text>
              <View
                style={[
                  styles.inputWrapper,
                  emailFocused && styles.inputWrapperFocused,
                  email && !validateEmail(email) && styles.inputWrapperError,
                ]}
              >
                <Ionicons name="mail-outline" size={20} color="#94a3b8" />
                <TextInput
                  style={styles.input}
                  placeholder="ornek@ogr.deu.edu.tr"
                  value={email}
                  autoCapitalize="none"
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>
            </View>

            {/* FACULTY */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Fakülte</Text>
              <TouchableOpacity
                style={styles.inputWrapper}
                onPress={() => setFacultyModal(true)}
              >
                <Ionicons name="school-outline" size={20} color="#94a3b8" />
                <Text style={[styles.input, { color: faculty ? "#1e293b" : "#94a3b8" }]}>
                  {faculty || "Fakülte seçiniz"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* PASSWORD */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Şifre</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
                <TextInput
                  style={styles.input}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="En az 6 karakter"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
              {strength && (
                <Text style={{ color: strength.color, fontWeight: "700" }}>
                  {strength.text}
                </Text>
              )}
            </View>

            {/* CONFIRM */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Şifre Tekrar</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
                <TextInput
                  style={styles.input}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* REGISTER */}
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <LinearGradient
                colors={["#667eea", "#764ba2"]}
                style={styles.registerGradient}
              >
                <Text style={styles.registerText}>
                  {isLoading ? "Kayıt Yapılıyor..." : "Kayıt Ol"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* FACULTY MODAL */}
      <Modal visible={facultyModal} animationType="slide">
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView>
            {FACULTIES.map((f) => (
              <TouchableOpacity
                key={f}
                style={styles.facultyItem}
                onPress={() => {
                  setFaculty(f);
                  setFacultyModal(false);
                }}
              >
                <Text style={styles.facultyText}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  scrollContent: { padding: 24 },
  header: { alignItems: "center", marginBottom: 32 },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: "800", color: "#1e293b" },
  subtitle: { fontSize: 14, color: "#64748b" },

  form: { gap: 20 },
  inputContainer: { gap: 6 },
  label: { fontWeight: "700", color: "#1e293b" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    paddingHorizontal: 14,
  },
  inputWrapperFocused: { borderColor: "#667eea" },
  inputWrapperError: { borderColor: "#ef4444" },
  input: { flex: 1, paddingVertical: 14, fontSize: 15 },

  registerButton: { borderRadius: 16, overflow: "hidden", marginTop: 10 },
  registerGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  registerText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  facultyItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  facultyText: { fontSize: 16 },
});
