import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import FeedScreen from "../screens/FeedScreen";
import ProfileScreen from "../screens/ProfileScreen";
const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => (
        <View style={styles.tabBar}>
          {/* FEED */}
          <TouchableOpacity onPress={() => navigation.navigate("Feed")}>
            <Ionicons
              name={state.index === 0 ? "home" : "home-outline"}
              size={28}
              color={state.index === 0 ? "#667eea" : "#999"}
            />
          </TouchableOpacity>

          {/* POST */}
          <TouchableOpacity
            style={styles.addButtonWrapper}
            onPress={() => navigation.navigate("PostModal")}
          >
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              style={styles.addButton}
            >
              <Ionicons name="add" size={32} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          {/* PROFILE */}
          <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
            <Ionicons
              name={state.index === 2 ? "person" : "person-outline"}
              size={28}
              color={state.index === 2 ? "#667eea" : "#999"}
            />
          </TouchableOpacity>
        </View>
      )}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />

      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  addButtonWrapper: { marginTop: -30 },
  addButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
});
