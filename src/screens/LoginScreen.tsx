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
} from "react-native";
import { useState } from "react";
import { login } from "../firebase/auth";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

type Props = NativeStackScreenProps<any>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Uyarı", "Lütfen tüm alanları doldurun");
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      Alert.alert("Başarılı! ✅", "Giriş yapıldı");
    } catch (err: any) {
      Alert.alert("Hata", err.message || "Giriş yapılamadı");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={["#667eea", "#764ba2"]}
                style={styles.logo}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="rocket" size={40} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Hoş Geldin! 👋</Text>
            <Text style={styles.subtitle}>Hesabına giriş yap</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>E-posta</Text>
              <View
                style={[
                  styles.inputWrapper,
                  emailFocused && styles.inputWrapperFocused,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={emailFocused ? "#667eea" : "#94a3b8"}
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="@ogr.deu.edu.tr"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  placeholderTextColor="#94a3b8"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Şifre</Text>
              <View
                style={[
                  styles.inputWrapper,
                  passwordFocused && styles.inputWrapperFocused,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={passwordFocused ? "#667eea" : "#94a3b8"}
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                  placeholderTextColor="#94a3b8"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                isLoading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  isLoading ? ["#cbd5e1", "#94a3b8"] : ["#667eea", "#764ba2"]
                }
                style={styles.loginGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <>
                    <View style={styles.loadingSpinner} />
                    <Text style={styles.loginText}>Giriş yapılıyor...</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.loginText}>Giriş Yap</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>veya</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Register Link */}
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate("Register")}
            activeOpacity={0.7}
          >
            <View style={styles.registerContent}>
              <Text style={styles.registerText}>Hesabın yok mu?</Text>
              <Text style={styles.registerLink}>Kayıt Ol</Text>
            </View>
          </TouchableOpacity>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={20} color="#10b981" />
            <Text style={styles.infoText}>
              Güvenli ve şifreli bağlantı ile korunuyorsunuz
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },

  header: {
    alignItems: "center",
    marginBottom: 40,
  },

  logoContainer: {
    marginBottom: 24,
  },

  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },

  form: {
    gap: 20,
    marginBottom: 32,
  },

  inputContainer: {
    gap: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
    marginLeft: 4,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  inputWrapperFocused: {
    borderColor: "#667eea",
    shadowColor: "#667eea",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  inputIcon: {
    marginRight: 12,
  },

  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: "#1e293b",
  },

  loginButton: {
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  loginButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },

  loginGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },

  loginText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },

  loadingSpinner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderTopColor: "#fff",
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    gap: 16,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e2e8f0",
  },

  dividerText: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "600",
  },

  registerButton: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    marginBottom: 24,
  },

  registerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 6,
  },

  registerText: {
    fontSize: 15,
    color: "#64748b",
    fontWeight: "500",
  },

  registerLink: {
    fontSize: 15,
    color: "#667eea",
    fontWeight: "700",
  },

  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },

  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#166534",
    lineHeight: 18,
  },
});