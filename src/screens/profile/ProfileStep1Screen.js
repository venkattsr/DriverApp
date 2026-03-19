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
import { updateDriverProfile } from "../../services/authService";
import useAuthStore from "../../store/authStore";

export default function ProfileStep1Screen({ navigation }) {
  const { user, refreshProfile } = useAuthStore();
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!email.trim()) {
      Toast.show({ type: "error", text1: "Please enter your email" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Toast.show({ type: "error", text1: "Please enter a valid email" });
      return;
    }
    if (!address.trim()) {
      Toast.show({ type: "error", text1: "Please enter your contact address" });
      return;
    }
    setLoading(true);
    try {
      await updateDriverProfile(user.uid, {
        email: email.trim(),
        contactAddress: address.trim(),
      });
      await refreshProfile();
      navigation.navigate("ProfileStep2");
    } catch {
      Toast.show({ type: "error", text1: "Failed to save. Try again." });
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
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: "25%" }]} />
            </View>
            <Text style={styles.progressText}>Step 1 of 4</Text>
          </View>
          <Text style={styles.title}>Basic Information</Text>
          <Text style={styles.subtitle}>Let's get to know you better</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>📧 Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="john@example.com"
                placeholderTextColor="#475569"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>🏠 Contact Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Door no, Street, City, State, PIN"
                placeholderTextColor="#475569"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            <TouchableOpacity
              style={[styles.nextBtn, loading && { opacity: 0.7 }]}
              onPress={handleNext}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.nextBtnText}>Continue →</Text>
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
  progressContainer: { marginBottom: 28 },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: { height: "100%", backgroundColor: COLORS.primary, borderRadius: 2 },
  progressText: { fontSize: 12, color: COLORS.textSecondary },
  title: { fontSize: 24, fontWeight: "700", color: COLORS.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 28 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  inputGroup: { marginBottom: 22 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
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
  textArea: { minHeight: 100, paddingTop: 14 },
  nextBtn: {
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
  nextBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
});
