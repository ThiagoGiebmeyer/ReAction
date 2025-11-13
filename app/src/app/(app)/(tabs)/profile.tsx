import {
  Image,
  Text,
  View,
  ActivityIndicator,
  ImageBackground,
  Alert,
  Platform,
} from "react-native";
import { useUser, useClerk } from "@clerk/clerk-expo";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import BlurredContainer from "@/components/BlurredContainer";
import ActionButton from "@/components/ActionButton";
import OrDivider from "@/components/OrDivider";
import { clearLocal, getLocal } from "@/utils/roomSession";
import { router } from "expo-router";

export default function Tab() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const userNameText =
    isLoaded && user
      ? user.fullName ||
        user.username ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        "Usuário"
      : getLocal("guestName");

  const userEmailText =
    isLoaded && user
      ? user.primaryEmailAddress?.emailAddress ||
        user.emailAddresses?.[0]?.emailAddress ||
        "email@exemplo.com"
      : "";

  const resetToAuth = async () => {
    await clearLocal("guestName");
    await signOut();
    router.replace(`/(auth)`);
  };

  const logOut = async () => {
    try {
      if (Platform.OS === "web") {
        return resetToAuth();
      }

      Alert.alert("Atenção!", "Deseja realmente sair?", [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Sair",
          style: "destructive",
          onPress: resetToAuth,
        },
      ]);
    } catch (error) {
      Alert.alert("Erro ao sair", "Não foi possível encerrar a sessão.");
      console.error("Erro ao deslogar:", error);
    }
  };

  return (
    <ImageBackground
      source={require("@/assets/images/backgroundOrange.png")}
      className="flex-1"
    >
      <SafeAreaView className="flex-1 w-full h-full items-center justify-center">
        <BlurredContainer>
          <View className="w-[150px] h-[150px] items-center justify-center bg-white rounded-full">
            {isLoaded && user?.imageUrl ? (
              <Image
                source={{ uri: user.imageUrl }}
                className="w-full h-full rounded-full"
                resizeMode="cover"
              />
            ) : (
              <Image
                source={require("@/assets/images/icon.png")}
                className="flex-1 w-full h-full"
                resizeMode="contain"
              />
            )}
          </View>

          <View className="w-full items-center justify-center mt-4 bg-white rounded-sm p-4">
            {!isLoaded ? (
              <ActivityIndicator
                size="small"
                className="color-primary-sBlue my-1"
              />
            ) : (
              <Text className="color-primary-sBlue font-extrabold text-4xl text-center">
                {userNameText}
              </Text>
            )}

            {!isLoaded ? (
              <ActivityIndicator
                size="small"
                className="color-primary-pBlue my-1"
              />
            ) : userEmailText ? (
              <Text className="color-primary-pBlue font-extrabold text-2x1 text-center">
                {userEmailText}
              </Text>
            ) : null}
          </View>
        </BlurredContainer>

        <OrDivider showText={false} dividerClassName="my-4" />

        <View className="w-[90%] items-center justify-center">
          <ActionButton
            onPress={logOut}
            title="Sair"
            buttonClassName="bg-primary-orange"
            textClassName="color-white"
          />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}
