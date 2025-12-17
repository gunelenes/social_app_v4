import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TabNavigator from "./TabNavigator";
import PostModalScreen from "../screens/PostModalScreen";
import CommentsScreen from "../screens/CommentsScreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="PostModal"
        component={PostModalScreen}
        options={{ presentation: "modal", headerShown: false }}
      />

      <Stack.Screen
        name="Comments"
        component={CommentsScreen}
        options={{
          title: "Yorumlar",
          headerBackTitle: "Geri",
        }}
      />
    </Stack.Navigator>
  );
}
