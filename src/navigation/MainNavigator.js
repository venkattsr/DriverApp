import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BookingDetailScreen from "../screens/bookings/BookingDetailScreen";
import BookingsScreen from "../screens/bookings/BookingsScreen";
import DashboardScreen from "../screens/dashboard/DashboardScreen";
import EditProfileScreen from "../screens/settings/EditProfileScreen";
import SettingsScreen from "../screens/settings/SettingsScreen";

import COLORS from "../constants/colors";

const Tab = createBottomTabNavigator();
const BookingsStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

const HEADER_STYLE = {
  headerStyle: { backgroundColor: COLORS.background },
  headerTintColor: COLORS.text,
  headerTitleStyle: { fontWeight: "700", fontSize: 18 },
};

function BookingsStackNavigator() {
  return (
    <BookingsStack.Navigator screenOptions={HEADER_STYLE}>
      <BookingsStack.Screen
        name="BookingsList"
        component={BookingsScreen}
        options={{ title: "My Bookings" }}
      />
      <BookingsStack.Screen
        name="BookingDetail"
        component={BookingDetailScreen}
        options={{ title: "Trip Details" }}
      />
    </BookingsStack.Navigator>
  );
}

function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={HEADER_STYLE}>
      <SettingsStack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
      <SettingsStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: "Edit Profile" }}
      />
    </SettingsStack.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
          // Add subtle top shadow for premium feel
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.03,
          shadowRadius: 10,
          elevation: 10,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            Dashboard: focused ? "speedometer" : "speedometer-outline",
            Bookings: focused ? "car" : "car-outline",
            Settings: focused ? "settings" : "settings-outline",
          };
          return <Ionicons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Bookings" component={BookingsStackNavigator} />
      <Tab.Screen name="Settings" component={SettingsStackNavigator} />
    </Tab.Navigator>
  );
}
