import { NavigationContainer } from "@react-navigation/native";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import COLORS from "../constants/colors";
import useAuthStore from "../store/authStore";
import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";
import ProfileSetupNavigator from "./ProfileSetupNavigator";

export default function RootNavigator() {
  const { user, driverProfile, loading } = useAuthStore();

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const isLoggedIn = !!user;
  const isProfileComplete = driverProfile?.profileComplete === true;

  return (
    <NavigationContainer>
      {!isLoggedIn ? (
        <AuthNavigator />
      ) : !isProfileComplete ? (
        <ProfileSetupNavigator />
      ) : (
        <MainNavigator />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
});
