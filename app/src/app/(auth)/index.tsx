import { useUser, useOAuth, useSignIn } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import React, { useState, useCallback, useEffect } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  Alert,
  ImageBackground,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import * as LinkingExpo from "expo-linking";
import AppLogo from "@/components/AppLogo";
import { SafeAreaView } from "react-native-safe-area-context";
import BlurredContainer from "@/components/BlurredContainer";
import OrDivider from "@/components/OrDivider";
import { saveLocal } from "@/utils/roomSession";
import { router } from "expo-router";
import { toast } from "sonner-native";

export const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== "web") {
      void WebBrowser.warmUpAsync();

      return () => {
        void WebBrowser.coolDownAsync();
      };
    }
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

type ScreenTitleProps = {
  text: string;
};

const ScreenTitle = ({ text }: ScreenTitleProps) => (
  <View className="w-full my-4 items-center justify-center">
    <Text className="color-white font-bold text-4xl">{text}</Text>
  </View>
);

const ActionButton = ({
  onPress = () => {},
  title = "",
  buttonClassName = "",
  textClassName = "",
  disabled = false,
}) => (
  <TouchableOpacity
    className={`p-2 w-[100%] h-12 rounded-sm items-center justify-center ${buttonClassName} ${
      disabled ? "opacity-50" : ""
    }`}
    onPress={onPress}
    disabled={disabled}
  >
    <Text className={`font-extrabold ${textClassName}`}>{title}</Text>
  </TouchableOpacity>
);

type OAuthStrategy = "oauth_google" | "oauth_facebook" | "oauth_github";
type ProcessingState = OAuthStrategy | "guest" | null;

export default function SignInScreen() {
  useWarmUpBrowser();

  const { user, isLoaded } = useUser();
  const { setActive } = useSignIn();

  const [isProcessing, setIsProcessing] = useState<ProcessingState>(null);
  const [guestName, setGuestName] = useState<string>("");

  const { startOAuthFlow: startGoogleAuth } = useOAuth({
    strategy: "oauth_google",
  });
  const { startOAuthFlow: startFacebookAuth } = useOAuth({
    strategy: "oauth_facebook",
  });
  const { startOAuthFlow: startGithubAuth } = useOAuth({
    strategy: "oauth_github",
  });

  const handleSocialSignIn = useCallback(
    async (strategy: OAuthStrategy) => {
      let oauthFlowFunction;
      switch (strategy) {
        case "oauth_google":
          oauthFlowFunction = startGoogleAuth;
          break;
        case "oauth_facebook":
          oauthFlowFunction = startFacebookAuth;
          break;
        case "oauth_github":
          oauthFlowFunction = startGithubAuth;
          break;
        default:
          return;
      }

      setIsProcessing(strategy);
      try {
        const { createdSessionId, setActive: setOAuthActive } =
          await oauthFlowFunction({
            redirectUrl: LinkingExpo.createURL("/(tabs)", {
              scheme: "caloriecare",
            }),
          });
        if (createdSessionId && setOAuthActive) {
          await setOAuthActive({ session: createdSessionId });
        }
      } catch (err: any) {
        console.error(
          `${strategy} OAuth error`,
          err.errors ? JSON.stringify(err.errors) : err
        );
        Alert.alert(
          "Erro de Autenticação",
          err.errors
            ? err.errors[0]?.longMessage || err.errors[0]?.message
            : "Não foi possível fazer login com este provedor."
        );
      } finally {
        setIsProcessing(null);
      }
    },
    [startGoogleAuth, startFacebookAuth, startGithubAuth, setActive]
  );

  const handleGuestSignIn = useCallback(async () => {
    if (!isLoaded) {
      toast.error("Aguarde...", {
        description: "O sistema de autenticação ainda está carregando.",
      });
      return;
    }

    if (!guestName.trim()) {
      toast.error("Ooops!", {
        description: "Por favor, insira um nome para continuar.",
      });
      return;
    } else {
      saveLocal(guestName, "guestName");
      router.replace("/(app)/(tabs)");
    }

    setIsProcessing("guest");
    try {
    } catch (err: any) {
    } finally {
      setIsProcessing(null);
    }
  }, [guestName, user, isLoaded]);

  return (
    <ImageBackground
      source={require("@/assets/images/backgroundBlue.png")}
      className="flex-1"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView className="flex-1 w-full h-full items-center pt-8">
          <AppLogo />
          <ScreenTitle text="Bem-vindo!" />

          <BlurredContainer containerClassName="gap-4">
            <View className="w-full">
              <TextInput
                placeholder={"Digite seu nome de visitante"}
                placeholderTextColor={"#B0B0B0"}
                className="bg-white p-6 w-full rounded-sm mb-4 text-primary-orange font-bold text-xl "
                autoCapitalize="characters"
                value={guestName}
                onChangeText={setGuestName}
                keyboardType="default"
                maxLength={20}
              />
              <ActionButton
                onPress={handleGuestSignIn}
                title={
                  isProcessing === "guest"
                    ? "Entrando..."
                    : "Entrar como Visitante"
                }
                buttonClassName="bg-primary-green"
                textClassName="color-white text-lg"
                disabled={isProcessing !== null || !isLoaded}
              />
            </View>
          </BlurredContainer>

          <OrDivider dividerClassName="my-4" />
          <View className="w-[90%] gap-3">
            <ActionButton
              onPress={() => handleSocialSignIn("oauth_google")}
              title={
                isProcessing === "oauth_google"
                  ? "Conectando..."
                  : "Continuar com Google"
              }
              buttonClassName="bg-primary-orange"
              textClassName="color-white text-lg"
              disabled={isProcessing !== null || !isLoaded}
            />
            <ActionButton
              onPress={() => handleSocialSignIn("oauth_facebook")}
              title={
                isProcessing === "oauth_facebook"
                  ? "Conectando..."
                  : "Continuar com Facebook"
              }
              buttonClassName="bg-primary-orange"
              textClassName="color-white text-lg"
              disabled={isProcessing !== null || !isLoaded}
            />
            <ActionButton
              onPress={() => handleSocialSignIn("oauth_github")}
              title={
                isProcessing === "oauth_github"
                  ? "Conectando..."
                  : "Continuar com GitHub"
              }
              buttonClassName="bg-primary-orange"
              textClassName="color-white text-lg"
              disabled={isProcessing !== null || !isLoaded}
            />
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </ImageBackground>
  );
}
