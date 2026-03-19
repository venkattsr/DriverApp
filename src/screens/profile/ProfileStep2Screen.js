import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import COLORS from "../../constants/colors";
import { updateDriverProfile } from "../../services/authService";
import { uploadDriverDocument } from "../../services/storageService";
import useAuthStore from "../../store/authStore";

function UploadBox({ label, subtitle, value, onCamera, onGallery, loading }) {
  return (
    <View style={styles.uploaderContainer}>
      <Text style={styles.uploaderLabel}>{label}</Text>
      <Text style={styles.uploaderSubtitle}>{subtitle}</Text>
      {value ? (
        <View style={styles.uploadedBox}>
          <Image source={{ uri: value }} style={styles.uploadedImage} resizeMode="cover" />
          <View style={styles.uploadedOverlay}>
            <Text style={styles.uploadedText}>✓ Uploaded</Text>
          </View>
          <View style={styles.changeButtons}>
            <TouchableOpacity style={styles.changeBtn} onPress={onCamera} disabled={loading}>
              <Text style={styles.changeBtnText}>📷 Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.changeBtn} onPress={onGallery} disabled={loading}>
              <Text style={styles.changeBtnText}>🖼️ Change</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.uploadActions}>
          {loading ? (
            <View style={[styles.uploadBtn, { justifyContent: "center" }]}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={[styles.uploadBtnText, { marginLeft: 8 }]}>Uploading...</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity style={styles.uploadBtn} onPress={onCamera} disabled={loading}>
                <Text style={styles.uploadBtnIcon}>📷</Text>
                <Text style={styles.uploadBtnText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.uploadBtn, styles.uploadBtnGallery]} onPress={onGallery} disabled={loading}>
                <Text style={styles.uploadBtnIcon}>🖼️</Text>
                <Text style={styles.uploadBtnText}>Gallery</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

export default function ProfileStep2Screen({ navigation }) {
  const { user, refreshProfile } = useAuthStore();
  const [licenseFront, setLicenseFront] = useState(null);
  const [licenseBack, setLicenseBack] = useState(null);
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const [saving, setSaving] = useState(false);

  const openCamera = async (side) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Toast.show({ type: "error", text1: "Camera permission denied. Enable in Settings." });
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true });
      if (!result.canceled && result.assets?.length > 0) {
        uploadImage(result.assets[0].uri, side);
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Camera failed: " + e.message });
    }
  };

  const openGallery = async (side) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Toast.show({ type: "error", text1: "Gallery permission denied. Enable in Settings." });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true });
      if (!result.canceled && result.assets?.length > 0) {
        uploadImage(result.assets[0].uri, side);
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Gallery failed: " + e.message });
    }
  };

  const uploadImage = async (uri, side) => {
    const setLoading = side === "front" ? setUploadingFront : setUploadingBack;
    const setImage = side === "front" ? setLicenseFront : setLicenseBack;
    setLoading(true);
    Toast.show({ type: "info", text1: "Uploading..." });
    try {
      const url = await uploadDriverDocument(user.uid, uri, `license_${side}`);
      setImage(url);
      Toast.show({ type: "success", text1: `License ${side} uploaded! ✓` });
    } catch (e) {
      Toast.show({ type: "error", text1: "Upload failed: " + e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      if (licenseFront || licenseBack) {
        await updateDriverProfile(user.uid, {
          licensePhotoFront: licenseFront || "",
          licensePhotoBack: licenseBack || "",
        });
        await refreshProfile();
      }
      navigation.navigate("ProfileStep3");
    } catch {
      Toast.show({ type: "error", text1: "Failed to save." });
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => navigation.navigate("ProfileStep3");

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "50%" }]} />
          </View>
          <Text style={styles.progressText}>Step 2 of 4</Text>
        </View>
        <Text style={styles.title}>Driving License</Text>
        <Text style={styles.subtitle}>Upload clear photos of both sides</Text>

        <UploadBox
          label="Front Side"
          subtitle="Name, license number and photo"
          value={licenseFront}
          onCamera={() => openCamera("front")}
          onGallery={() => openGallery("front")}
          loading={uploadingFront}
        />
        <UploadBox
          label="Back Side"
          subtitle="Vehicle class and validity dates"
          value={licenseBack}
          onCamera={() => openCamera("back")}
          onGallery={() => openGallery("back")}
          loading={uploadingBack}
        />

        <TouchableOpacity
          style={[styles.nextBtn, saving && { opacity: 0.7 }]}
          onPress={handleNext}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.nextBtnText}>Continue →</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipBtnText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 40 },
  progressContainer: { marginBottom: 28 },
  progressBar: { height: 4, backgroundColor: COLORS.border, borderRadius: 2, marginBottom: 8 },
  progressFill: { height: "100%", backgroundColor: COLORS.primary, borderRadius: 2 },
  progressText: { fontSize: 12, color: COLORS.textSecondary },
  title: { fontSize: 24, fontWeight: "700", color: COLORS.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 28 },
  uploaderContainer: { marginBottom: 24 },
  uploaderLabel: { fontSize: 15, fontWeight: "600", color: COLORS.text, marginBottom: 4 },
  uploaderSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 },
  uploadActions: {
    flexDirection: "row",
    gap: 12,
  },
  uploadBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    paddingVertical: 22,
  },
  uploadBtnGallery: { borderColor: COLORS.primary },
  uploadBtnIcon: { fontSize: 22 },
  uploadBtnText: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  uploadedBox: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: COLORS.primary,
    height: 160,
    position: "relative",
  },
  uploadedImage: { width: "100%", height: "100%" },
  uploadedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(79, 70, 229, 0.7)",
    paddingVertical: 6,
    alignItems: "center",
  },
  uploadedText: { color: COLORS.white, fontWeight: "700", fontSize: 13 },
  changeButtons: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  changeBtn: { flex: 1, alignItems: "center", paddingVertical: 8 },
  changeBtnText: { color: COLORS.white, fontSize: 13, fontWeight: "600" },
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
  skipBtn: { alignItems: "center", paddingVertical: 14 },
  skipBtnText: { color: COLORS.textSecondary, fontSize: 14 },
});
