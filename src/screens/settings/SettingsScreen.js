import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import COLORS from "../../constants/colors";
import { logoutDriver, toggleAvailability } from "../../services/authService";
import useAuthStore from "../../store/authStore";

const VEHICLE_LABELS = {
  two_wheeler: "Two Wheeler",
  four_wheeler_auto: "4W Auto",
  four_wheeler_manual: "4W Manual",
  auto_rickshaw: "Auto Rickshaw",
};

function SettingRow({ icon, label, subtitle, onPress, rightElement, danger }) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View
        style={[
          styles.settingIcon,
          danger && { backgroundColor: "rgba(239,68,68,0.12)" },
        ]}
      >
        <Text style={styles.settingIconText}>{icon}</Text>
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, danger && { color: "#EF4444" }]}>
          {label}
        </Text>
        {subtitle ? (
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
      {rightElement ? (
        rightElement
      ) : onPress ? (
        <Text style={styles.settingArrow}>›</Text>
      ) : null}
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ navigation }) {
  const { user, driverProfile, updateLocalProfile, clearAuth } = useAuthStore();
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isAvailable = driverProfile?.isAvailable ?? true;

  const handleToggleAvailability = async (value) => {
    setTogglingAvailability(true);
    try {
      await toggleAvailability(user.uid, value);
      updateLocalProfile({ isAvailable: value });
      Toast.show({
        type: "success",
        text1: value ? "✅ You are now Available" : "🔴 You are now Off Duty",
        text2: value
          ? "You will receive new bookings."
          : "No new bookings will be assigned.",
      });
    } catch {
      Toast.show({ type: "error", text1: "Failed to update availability." });
    } finally {
      setTogglingAvailability(false);
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to sign out?")) {
        setLoggingOut(true);
        try {
          await logoutDriver();
          clearAuth();
        } catch {
          Toast.show({ type: "error", text1: "Failed to sign out" });
        } finally {
          setLoggingOut(false);
        }
      }
      return;
    }

    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logoutDriver();
            clearAuth();
          } catch {
            Toast.show({ type: "error", text1: "Failed to sign out" });
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };
  const vehicleLabels = (driverProfile?.vehicleTypes || [])
    .map((v) => VEHICLE_LABELS[v] || v)
    .join(" · ");

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(driverProfile?.name)}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {driverProfile?.name || "Driver"}
            </Text>
            <Text style={styles.profilePhone}>
              +91 {driverProfile?.phone || ""}
            </Text>
            {driverProfile?.email ? (
              <Text style={styles.profileEmail}>{driverProfile.email}</Text>
            ) : null}
            {vehicleLabels ? (
              <Text style={styles.vehicleBadge}>{vehicleLabels}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <View
            style={[
              styles.availabilityCard,
              isAvailable
                ? styles.availabilityCardOn
                : styles.availabilityCardOff,
            ]}
          >
            <View style={styles.availabilityInfo}>
              <Text style={styles.availabilityIcon}>
                {isAvailable ? "🟢" : "🔴"}
              </Text>
              <View>
                <Text style={styles.availabilityTitle}>
                  {isAvailable
                    ? "Available for Rides"
                    : "Off Duty (Leave Mode)"}
                </Text>
                <Text style={styles.availabilitySubtitle}>
                  {isAvailable
                    ? "New bookings will be assigned to you"
                    : "No new bookings until you turn this on"}
                </Text>
              </View>
            </View>
            {togglingAvailability ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Switch
                value={isAvailable}
                onValueChange={handleToggleAvailability}
                trackColor={{ false: COLORS.border, true: "rgba(79, 70, 229, 0.4)" }}
                thumbColor={isAvailable ? COLORS.primary : COLORS.textSecondary}
                ios_backgroundColor={COLORS.border}
              />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.settingsCard}>
            <SettingRow
              icon="👤"
              label="Edit Profile"
              subtitle="Update your personal information"
              onPress={() => navigation.navigate("EditProfile")}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="📋"
              label="Documents"
              subtitle="License, Aadhaar"
              onPress={() => Toast.show({ type: "info", text1: "Coming soon" })}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="🚗"
              label="Vehicle Types"
              subtitle={vehicleLabels || "Not set"}
              onPress={() => Toast.show({ type: "info", text1: "Coming soon" })}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <View style={styles.settingsCard}>
            <SettingRow
              icon="🔔"
              label="Notifications"
              onPress={() => Toast.show({ type: "info", text1: "Coming soon" })}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="❓"
              label="Help & Support"
              onPress={() => Toast.show({ type: "info", text1: "Coming soon" })}
            />
            <View style={styles.divider} />
            <SettingRow icon="ℹ️" label="About" subtitle="Version 1.0.0" />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.settingsCard}>
            <SettingRow
              icon="🚪"
              label={loggingOut ? "Signing out..." : "Sign Out"}
              onPress={loggingOut ? null : handleLogout}
              danger
            />
          </View>
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    margin: 16,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarText: { color: COLORS.white, fontSize: 22, fontWeight: "700" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: "700", color: COLORS.text },
  profilePhone: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  profileEmail: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  vehicleBadge: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "600",
    marginTop: 6,
  },
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  editBtnText: { color: COLORS.primary, fontSize: 13, fontWeight: "600" },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  availabilityCard: {
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5,
  },
  availabilityCardOn: {
    backgroundColor: "rgba(79, 70, 229, 0.08)",
    borderColor: "rgba(79, 70, 229, 0.3)",
  },
  availabilityCardOff: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  availabilityInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    marginRight: 12,
  },
  availabilityIcon: { fontSize: 22, marginRight: 12, marginTop: 2 },
  availabilityTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  availabilitySubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    maxWidth: 200,
  },
  settingsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  settingRow: { flexDirection: "row", alignItems: "center", padding: 16 },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(79, 70, 229, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  settingIconText: { fontSize: 18 },
  settingContent: { flex: 1 },
  settingLabel: { fontSize: 15, color: COLORS.text, fontWeight: "500" },
  settingSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  settingArrow: { fontSize: 22, color: COLORS.textSecondary },
  divider: { height: 1, backgroundColor: COLORS.border, marginLeft: 68 },
});
