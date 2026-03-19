import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import COLORS from "../../constants/colors";
import { registerDriver } from "../../services/authService";

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    if (
      !name.trim() ||
      !phone.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      Toast.show({ type: "error", text1: "Please fill in all fields" });
      return;
    }
    if (phone.length < 10) {
      Toast.show({
        type: "error",
        text1: "Enter a valid 10-digit phone number",
      });
      return;
    }
    if (password.length < 6) {
      Toast.show({
        type: "error",
        text1: "Password must be at least 6 characters",
      });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({ type: "error", text1: "Passwords do not match" });
      return;
    }
    setLoading(true);
    try {
      await registerDriver(name.trim(), phone.trim(), password);
      Toast.show({
        type: "success",
        text1: "Account created! Complete your profile.",
      });
    } catch (error) {
      console.error("Registration error:", error.code, error.message);
      let message = "Registration failed. Please try again.";
      if (error.code === "auth/email-already-in-use")
        message = "Account with this phone already exists.";
      else if (error.code === "auth/weak-password")
        message = "Password is too weak.";
      else if (error.code === "auth/network-request-failed")
        message = "No internet connection. Check your WiFi.";
      else if (error.code === "auth/operation-not-allowed")
        message = "Email/Password login not enabled in Firebase Console.";
      else if (error.code === "auth/invalid-api-key")
        message = "Invalid Firebase API key. Check firebase.js config.";
      else if (error.message)
        message = error.message;
      Toast.show({ type: "error", text1: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>← Back to Sign In</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join as a driver and start earning
          </Text>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="#475569"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.phoneContainer}>
                <Text style={styles.phonePrefix}>+91</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="9876543210"
                  placeholderTextColor="#475569"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Min. 6 characters"
                  placeholderTextColor="#475569"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Text>{showPassword ? "🙈" : "👁️"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter password"
                placeholderTextColor="#475569"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                onSubmitEditing={handleSignup}
              />
            </View>

            <TouchableOpacity
              style={[styles.signupBtn, loading && { opacity: 0.7 }]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.signupBtnText}>Create Account →</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, padding: 24 },
  backBtn: { marginBottom: 24, marginTop: 8 },
  backText: { color: COLORS.primary, fontSize: 15, fontWeight: "500" },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginTop: 6, marginBottom: 28 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 15,
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
  },
  phonePrefix: { color: COLORS.textSecondary, fontSize: 15, marginRight: 8 },
  phoneInput: { flex: 1, color: COLORS.text, fontSize: 15, paddingVertical: 14 },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
  },
  passwordInput: { flex: 1, color: COLORS.text, fontSize: 15, paddingVertical: 14 },
  eyeBtn: { padding: 4 },
  signupBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  signupBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
});
