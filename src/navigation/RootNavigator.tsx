import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TabNavigator from "./TabNavigator";
import PostModalScreen from "../screens/PostModalScreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen
        name="PostModal"
        component={PostModalScreen}
        options={{ presentation: "modal" }}
      />
    </Stack.Navigator>
  );
}
