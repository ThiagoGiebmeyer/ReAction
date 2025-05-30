import { SessionProvider } from "@/ctx";
import { router, Slot } from "expo-router";
import { ClerkLoaded, ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";

import "@/global.css";

import {
  Jersey25Charted_400Regular,
  useFonts,
} from "@expo-google-fonts/jersey-25-charted";
import { ActivityIndicator, Image, View } from "react-native";
import { Toaster } from "sonner-native";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { clearLocal } from "@/utils/roomSession";

export default function Layout() {
  const [loaded] = useFonts({
    JCharted: Jersey25Charted_400Regular,
  });

  function InitialLayout() {
    const { isSignedIn, isLoaded } = useAuth();

    useEffect(() => {
      if (!isLoaded) return;
      clearLocal("guestName");

      if (isSignedIn) {
        router.replace("/(app)/(tabs)");
      } else {
        router.replace("/(auth)");
      }
    }, [isSignedIn, isLoaded]);

    return isLoaded ? (
      <>
        <Slot />
        <Toaster />
      </>
    ) : (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" className="text-primary" />
      </View>
    );
  }

  if (!loaded) {
    return (
      <View className="flex-1 items-center justify-center bg-primary-pBlue">
        <View className="w-4/12 h-1/3 items-center justify-center">
          <Image
            source={require("@/assets/images/icon.png")}
            className="flex-1 w-full h-full"
            resizeMode="contain"
          />
        </View>
      </View>
    );
  }

  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
          <ClerkLoaded>
            <SessionProvider>
              <InitialLayout />
            </SessionProvider>
          </ClerkLoaded>
        </ClerkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
