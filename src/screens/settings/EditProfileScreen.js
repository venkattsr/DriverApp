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

const VEHICLE_OPTIONS = [
  { id: "two_wheeler", label: "Two Wheeler", icon: "🛵" },
  { id: "four_wheeler_auto", label: "4W Auto", icon: "🚗" },
  { id: "four_wheeler_manual", label: "4W Manual", icon: "🚙" },
  { id: "auto_rickshaw", label: "Auto Rickshaw", icon: "🛺" },
];

export default function EditProfileScreen({ navigation }) {
  const { user, driverProfile, refreshProfile } = useAuthStore();
  const [name, setName] = useState(driverProfile?.name || "");
  const [email, setEmail] = useState(driverProfile?.email || "");
  const [address, setAddress] = useState(driverProfile?.contactAddress || "");
  const [selectedVehicles, setSelectedVehicles] = useState(
    driverProfile?.vehicleTypes || [],
  );
  const [saving, setSaving] = useState(false);

  const toggleVehicle = (id) =>
    setSelectedVehicles((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.show({ type: "error", text1: "Name cannot be empty" });
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Toast.show({ type: "error", text1: "Enter a valid email" });
      return;
    }
    if (selectedVehicles.length === 0) {
      Toast.show({ type: "error", text1: "Select at least one vehicle type" });
      return;
    }
    setSaving(true);
    try {
      await updateDriverProfile(user.uid, {
        name: name.trim(),
        email: email.trim(),
        contactAddress: address.trim(),
        vehicleTypes: selectedVehicles,
      });
      await refreshProfile();
      Toast.show({ type: "success", text1: "Profile updated!" });
      navigation.goBack();
    } catch {
      Toast.show({ type: "error", text1: "Failed to save changes" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || "?"}
              </Text>
            </View>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Personal Information</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.disabledInput}>
                <Text style={styles.disabledText}>
                  +91 {driverProfile?.phone}
                </Text>
                <Text style={{ color: "#94A3B8", fontSize: 12 }}>
                  🔒 Locked
                </Text>
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={address}
                onChangeText={setAddress}
                placeholder="Your full address"
                placeholderTextColor={COLORS.textSecondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Vehicle Types</Text>
            <View style={styles.vehicleGrid}>
              {VEHICLE_OPTIONS.map((v) => {
                const selected = selectedVehicles.includes(v.id);
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[
                      styles.vehicleBtn,
                      selected && styles.vehicleBtnSelected,
                    ]}
                    onPress={() => toggleVehicle(v.id)}
                  >
                    <Text style={styles.vehicleBtnIcon}>{v.icon}</Text>
                    <Text
                      style={[
                        styles.vehicleBtnLabel,
                        selected && { color: "#fff" },
                      ]}
                    >
                      {v.label}
                    </Text>
                    {selected && <Text style={styles.vehicleCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16 },
  avatarSection: { alignItems: "center", marginVertical: 20 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: COLORS.white, fontSize: 30, fontWeight: "700" },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 20,
  },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: COLORS.text,
    fontSize: 15,
  },
  textArea: { minHeight: 80, paddingTop: 13 },
  disabledInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  disabledText: { color: COLORS.textSecondary, fontSize: 15 },
  vehicleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  vehicleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 8,
  },
  vehicleBtnSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(79, 70, 229, 0.08)",
  },
  vehicleBtnIcon: { fontSize: 20 },
  vehicleBtnLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "500" },
  vehicleCheck: { fontSize: 14, color: COLORS.primary, fontWeight: "700" },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
});
