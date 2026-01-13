import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TabNavigator from "./TabNavigator";

import PostModalScreen from "../screens/PostModalScreen";
import CommentsScreen from "../screens/CommentsScreen";
import UserSearchScreen from "../screens/UserSearchScreen";
import ChatScreen from "../screens/ChatScreen";
import ListingDetailScreen from "../screens/ListingDetailScreen";
import EditListingScreen from "../screens/EditListingScreen";
import CreateListingScreen from "../screens/CreateListingScreen";
import UserDetailScreen from "../screens/UserDetailScreen";
import FacultyFeedScreen from "../screens/FacultyFeedScreen";
import FacultyCreatePostScreen from "../screens/FacultyCreatePostScreen";
const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator>
    
    
      {/* ---------------- MAIN TABS ---------------- */}
      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
          {/* ---------------- FACULTY FEED ---------------- */}
      <Stack.Screen
        name="FacultyFeed"
        component={FacultyFeedScreen}
        options={{headerShown: false
        }}
      />
      <Stack.Screen name="FacultyCreatePost" component={FacultyCreatePostScreen} />
      {/* ---------------- MODALS ---------------- */}
      <Stack.Screen
        name="PostModal"
        component={PostModalScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />

      {/* ---------------- SEARCH ---------------- */}
      <Stack.Screen
        name="UserSearch"
        component={UserSearchScreen}
        options={{ title: "Kullanıcı Ara" }}
      />

      {/* ---------------- CHAT ---------------- */}
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: "Mesajlaşma" }}
      />

      {/* ---------------- COMMENTS ---------------- */}
      <Stack.Screen
        name="Comments"
        component={CommentsScreen}
        options={{
          title: "Yorumlar",
          headerBackTitle: "Geri",
        }}
      />

      {/* ---------------- USER PROFILE (READ ONLY) ---------------- */}
      <Stack.Screen
        name="UserDetail"
        component={UserDetailScreen}
        options={{
          headerShown: false,
        }}
      />

      {/* ---------------- LISTINGS ---------------- */}
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
