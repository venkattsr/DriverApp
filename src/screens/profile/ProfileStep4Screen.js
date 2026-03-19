import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import {
    markProfileComplete,
    updateDriverProfile,
} from "../../services/authService";
import { uploadDriverDocument } from "../../services/storageService";
import useAuthStore from "../../store/authStore";
import COLORS from "../../constants/colors";

const VEHICLE_OPTIONS = [
  { id: "two_wheeler", label: "Two Wheeler", icon: "🛵", description: "Bikes, scooters" },
  { id: "four_wheeler_auto", label: "Four Wheeler – Auto", icon: "🚗", description: "Automatic cars" },
  { id: "four_wheeler_manual", label: "Four Wheeler – Manual", icon: "🚙", description: "Manual cars" },
  { id: "auto_rickshaw", label: "Auto Rickshaw", icon: "🛺", description: "Three-wheeler" },
];

function UploadBox({ label, subtitle, value, onUpload, loading }) {
  return (
    <View style={styles.uploaderContainer}>
      <Text style={styles.uploaderLabel}>{label}</Text>
      <Text style={styles.uploaderSubtitle}>{subtitle}</Text>
      <TouchableOpacity
        style={[styles.uploadBox, value && styles.uploadBoxFilled]}
        onPress={onUpload}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : value ? (
          <>
            <Image source={{ uri: value }} style={styles.uploadedImage} resizeMode="cover" />
            <View style={styles.uploadedOverlay}>
              <Text style={styles.uploadedText}>✓ Tap to change</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.uploadIcon}>📄</Text>
            <Text style={styles.uploadText}>Tap to upload</Text>
            <Text style={styles.uploadHint}>Camera or Gallery</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function ProfileStep4Screen() {
  const { user, refreshProfile } = useAuthStore();
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [insuranceDoc, setInsuranceDoc] = useState(null);
  const [uploadingInsurance, setUploadingInsurance] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleVehicle = (id) => {
    setSelectedVehicles((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };

  const handlePickInsurance = () => {
    Alert.alert("Upload Document", "Choose source", [
      { text: "Camera", onPress: () => openCamera() },
      { text: "Gallery", onPress: () => openGallery() },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Toast.show({ type: "error", text1: "Camera permission denied" });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true });
    if (!result.canceled) uploadImage(result.assets[0].uri);
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Toast.show({ type: "error", text1: "Gallery permission denied" });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true });
    if (!result.canceled) uploadImage(result.assets[0].uri);
  };

  const uploadImage = async (uri) => {
    setUploadingInsurance(true);
    try {
      const url = await uploadDriverDocument(user.uid, uri, "insurance");
      setInsuranceDoc(url);
      Toast.show({ type: "success", text1: "Insurance uploaded!" });
    } catch {
      Toast.show({ type: "error", text1: "Upload failed. Try again." });
    } finally {
      setUploadingInsurance(false);
    }
  };

  const handleComplete = async () => {
    if (selectedVehicles.length === 0) {
      Toast.show({ type: "error", text1: "Select at least one vehicle type" });
      return;
    }

    setSaving(true);
    try {
      const updateData = { vehicleTypes: selectedVehicles };
      if (registrationNumber.trim()) updateData.registrationNumber = registrationNumber.trim();
      if (insuranceDoc) updateData.insuranceDoc = insuranceDoc;

      await updateDriverProfile(user.uid, updateData);
      await markProfileComplete(user.uid);
      await refreshProfile();
    } catch {
      Toast.show({ type: "error", text1: "Failed to save. Try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "100%" }]} />
          </View>
          <Text style={[styles.progressText, { color: "#22C55E" }]}>
            Step 4 of 4 — Final Step!
          </Text>
        </View>

        <Text style={styles.title}>Vehicle Details</Text>
        <Text style={styles.subtitle}>Select all vehicles you can drive</Text>
        <View style={styles.vehicleGrid}>
          {VEHICLE_OPTIONS.map((vehicle) => {
            const isSelected = selectedVehicles.includes(vehicle.id);
            return (
              <TouchableOpacity
                key={vehicle.id}
                style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
                onPress={() => toggleVehicle(vehicle.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkBox, isSelected && styles.checkBoxSelected]}>
                  {isSelected && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={styles.vehicleIcon}>{vehicle.icon}</Text>
                <Text style={[styles.vehicleLabel, isSelected && { color: "#F1F5F9" }]}>
                  {vehicle.label}
                </Text>
                <Text style={styles.vehicleDesc}>{vehicle.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Vehicle Registration Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. MH 12 AB 1234"
            placeholderTextColor="#475569"
            value={registrationNumber}
            onChangeText={setRegistrationNumber}
            autoCapitalize="characters"
          />
        </View>

        <UploadBox
          label="Vehicle Insurance"
          subtitle="Upload clear copy of active insurance"
          value={insuranceDoc}
          onUpload={handlePickInsurance}
          loading={uploadingInsurance}
        />

        <View style={styles.completionCard}>
          <Text style={styles.completionTitle}>🎉 Almost there!</Text>
          <Text style={styles.completionText}>
            Your profile will be reviewed. You can start receiving bookings after verification (usually within 24 hours).
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.completeBtn, saving && { opacity: 0.7 }]}
          onPress={handleComplete}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.completeBtnText}>Complete Profile 🚀</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 40 },
  progressContainer: { marginBottom: 28 },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: { height: "100%", backgroundColor: COLORS.success, borderRadius: 2 },
  progressText: { fontSize: 12, color: COLORS.textSecondary },
  title: { fontSize: 24, fontWeight: "700", color: COLORS.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 28 },
  vehicleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  vehicleCard: {
    width: "47%",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  vehicleCardSelected: { borderColor: COLORS.primary, backgroundColor: "rgba(79, 70, 229, 0.05)" },
  checkBox: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkBoxSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkMark: { color: COLORS.white, fontSize: 12, fontWeight: "700" },
  vehicleIcon: { fontSize: 40, marginBottom: 10, marginTop: 6 },
  vehicleLabel: { fontSize: 13, fontWeight: "600", color: COLORS.text, textAlign: "center", marginBottom: 4 },
  vehicleDesc: { fontSize: 11, color: COLORS.textSecondary, textAlign: "center" },
  inputGroup: { marginBottom: 22 },
  label: { fontSize: 14, fontWeight: "600", color: COLORS.text, marginBottom: 10 },
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
  uploaderContainer: { marginBottom: 24 },
  uploaderLabel: { fontSize: 15, fontWeight: "600", color: COLORS.text, marginBottom: 4 },
  uploaderSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 },
  uploadBox: {
    height: 160,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  uploadBoxFilled: { borderStyle: "solid", borderColor: COLORS.primary },
  uploadedImage: { width: "100%", height: "100%" },
  uploadedOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(79, 70, 229, 0.85)",
    paddingVertical: 10,
  },
  uploadedText: { color: COLORS.white, textAlign: "center", fontSize: 13, fontWeight: "600" },
  uploadIcon: { fontSize: 36, marginBottom: 8 },
  uploadText: { color: COLORS.text, fontSize: 15, fontWeight: "600" },
  uploadHint: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  completionCard: {
    backgroundColor: "rgba(79, 70, 229, 0.1)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(79, 70, 229, 0.2)",
  },
  completionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text, marginBottom: 8 },
  completionText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  completeBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  completeBtnText: { color: COLORS.white, fontSize: 17, fontWeight: "700" },
});
