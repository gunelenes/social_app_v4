import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TabNavigator from "./TabNavigator";
import PostModalScreen from "../screens/PostModalScreen";
import CommentsScreen from "../screens/CommentsScreen";
import UserSearchScreen from "../screens/UserSearchScreen";
import ChatScreen from "../screens/ChatScreen";
import ListingDetailScreen from "../screens/ListingDetailScreen";
import EditListingScreen from "../screens/EditListingScreen";
import CreateListingScreen from "../screens/CreateListingScreen";

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
        name="UserSearch"
        component={UserSearchScreen}
        options={{ title: "Kullanıcı Ara" }}
      />

      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: "Mesajlaşma" }}
      />

      <Stack.Screen
        name="Comments"
        component={CommentsScreen}
        options={{
          title: "Yorumlar",
          headerBackTitle: "Geri",
        }}
      />
      <Stack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        options={{ title: "İlan Detayı" }}
      />
      <Stack.Screen
        name="CreateListing"
        component={CreateListingScreen}
        options={{ title: "İlan Oluştur" }}
      />

      <Stack.Screen
        name="EditListing"
        component={EditListingScreen}
        options={{ title: "İlanı Düzenle" }}
      />
    </Stack.Navigator>
  );
}
