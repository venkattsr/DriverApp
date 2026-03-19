import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import RootNavigator from "./src/navigation/RootNavigator";
import useAuthStore from "./src/store/authStore";

export default function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return unsubscribe;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#0F172A" />
        <RootNavigator />
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
