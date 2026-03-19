import { createNativeStackNavigator } from "@react-navigation/native-stack";
import COLORS from "../constants/colors";
import ProfileStep1Screen from "../screens/profile/ProfileStep1Screen";
import ProfileStep2Screen from "../screens/profile/ProfileStep2Screen";
import ProfileStep3Screen from "../screens/profile/ProfileStep3Screen";
import ProfileStep4Screen from "../screens/profile/ProfileStep4Screen";

const Stack = createNativeStackNavigator();

export default function ProfileSetupNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Stack.Screen
        name="ProfileStep1"
        component={ProfileStep1Screen}
        options={{ title: "Basic Info", headerLeft: () => null }}
      />
      <Stack.Screen
        name="ProfileStep2"
        component={ProfileStep2Screen}
        options={{ title: "License Photos" }}
      />
      <Stack.Screen
        name="ProfileStep3"
        component={ProfileStep3Screen}
        options={{ title: "Aadhaar Photos" }}
      />
      <Stack.Screen
        name="ProfileStep4"
        component={ProfileStep4Screen}
        options={{ title: "Vehicle Types" }}
      />
    </Stack.Navigator>
  );
}
