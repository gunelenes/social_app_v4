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
import { register } from "../firebase/auth";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

type Props = NativeStackScreenProps<any>;

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const validateEmail = (email: string) => {
    return email.toLowerCase().endsWith("@ogr.deu.edu.tr");
  };

  const handleRegister = async () => {
    // Validation
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert("Uyarı", "Lütfen tüm alanları doldurun");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Uyarı", "Lütfen @ogr.deu.edu.tr uzantılı bir mail adresi kullanın");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Uyarı", "Şifre en az 6 karakter olmalıdır");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Uyarı", "Şifreler eşleşmiyor");
      return;
    }

    setIsLoading(true);
    try {
      await register(email.trim(), password);
      Alert.alert(
        "Başarılı! ✅",
        "Doğrulama maili gönderildi. Lütfen mailinizi kontrol edin.",
        [
          {
            text: "Tamam",
            onPress: () => navigation.navigate("Login"),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Hata", err.message || "Kayıt oluşturulamadı");
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
                <Ionicons name="person-add" size={40} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Hesap Oluştur 🎉</Text>
            <Text style={styles.subtitle}>DEÜ öğrenci mailinle kayıt ol</Text>
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
                  email && !validateEmail(email) && styles.inputWrapperError,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={emailFocused ? "#667eea" : "#94a3b8"}
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="ornek@ogr.deu.edu.tr"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  placeholderTextColor="#94a3b8"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
                {email && validateEmail(email) && (
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                )}
              </View>
              {email && !validateEmail(email) && (
                <Text style={styles.errorText}>
                  @ogr.deu.edu.tr uzantılı mail kullanın
                </Text>
              )}
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
                  placeholder="En az 6 karakter"
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
              {strength && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBar}>
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          width:
                            strength.text === "Zayıf"
                              ? "33%"
                              : strength.text === "Orta"
                              ? "66%"
                              : "100%",
                          backgroundColor: strength.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.strengthText, { color: strength.color }]}>
                    {strength.text}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Şifre Tekrar</Text>
              <View
                style={[
                  styles.inputWrapper,
                  confirmPasswordFocused && styles.inputWrapperFocused,
                  confirmPassword &&
                    password !== confirmPassword &&
                    styles.inputWrapperError,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={confirmPasswordFocused ? "#667eea" : "#94a3b8"}
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Şifreyi tekrar girin"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={styles.input}
                  placeholderTextColor="#94a3b8"
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => setConfirmPasswordFocused(false)}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
              {confirmPassword && password !== confirmPassword && (
                <Text style={styles.errorText}>Şifreler eşleşmiyor</Text>
              )}
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[
                styles.registerButton,
                isLoading && styles.registerButtonDisabled,
              ]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  isLoading ? ["#cbd5e1", "#94a3b8"] : ["#667eea", "#764ba2"]
                }
                style={styles.registerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <>
                    <View style={styles.loadingSpinner} />
                    <Text style={styles.registerText}>Kayıt yapılıyor...</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.registerText}>Kayıt Ol</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="mail-outline" size={20} color="#667eea" />
            <Text style={styles.infoText}>
              Kayıt sonrası mailinize doğrulama linki gönderilecektir
            </Text>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>veya</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Login Link */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.7}
          >
            <View style={styles.loginContent}>
              <Text style={styles.loginText}>Zaten hesabın var mı?</Text>
              <Text style={styles.loginLink}>Giriş Yap</Text>
            </View>
          </TouchableOpacity>
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
    marginBottom: 24,
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

  inputWrapperError: {
    borderColor: "#ef4444",
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

  errorText: {
    fontSize: 13,
    color: "#ef4444",
    marginLeft: 4,
    fontWeight: "500",
  },

  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
    overflow: "hidden",
  },

  strengthFill: {
    height: "100%",
    borderRadius: 2,
  },

  strengthText: {
    fontSize: 12,
    fontWeight: "700",
  },

  registerButton: {
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  registerButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },

  registerGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },

  registerText: {
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

  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "#dbeafe",
    marginBottom: 24,
  },

  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#1e40af",
    lineHeight: 18,
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
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

  loginButton: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },

  loginContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 6,
  },

  loginText: {
    fontSize: 15,
    color: "#64748b",
    fontWeight: "500",
  },

  loginLink: {
    fontSize: 15,
    color: "#667eea",
    fontWeight: "700",
  },
});