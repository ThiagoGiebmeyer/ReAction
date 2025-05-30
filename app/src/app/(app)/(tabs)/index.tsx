import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  Keyboard,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import socketManager from "@/socket/socketManager";
import { getLocal, saveLocal } from "@/utils/roomSession";
import { toast } from "sonner-native";
import AppLogo from "@/components/AppLogo";
import ActionButton from "@/components/ActionButton";
import { SafeAreaView } from "react-native-safe-area-context";
import BlurredContainer from "@/components/BlurredContainer";
import { useUser } from "@clerk/clerk-expo";
import OrDivider from "@/components/OrDivider";

const ScreenBackground = () => (
  <Image
    source={require("@/assets/images/backgroundBlue.png")}
    className="absolute w-full h-full"
    resizeMode="cover"
  />
);

type PinInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  maxLength?: number;
};

const PinInput = ({
  value,
  onChangeText,
  placeholder,
  placeholderTextColor,
  maxLength,
}: PinInputProps) => (
  <TextInput
    placeholder={placeholder}
    placeholderTextColor={placeholderTextColor}
    className="bg-white p-4 w-full h-24 rounded-md mb-4 text-primary-orange font-extrabold text-4xl text-center"
    autoCapitalize="characters"
    value={value}
    onChangeText={onChangeText}
    keyboardType="default"
    maxLength={maxLength}
  />
);

export default function Tab() {
  const router = useRouter();
  const { user } = useUser();
  const [roomCode, setRoomCode] = useState("");

  const navigateToCreateRoom = () => {
    router.push("/createRoom");
  };

  const handleJoinRoom = async () => {
    if (!roomCode || roomCode.trim().length !== 5) {
      toast.error("Por favor, insira um PIN de 5 caracteres.", {
        style: { backgroundColor: "#0072BB" },
      });
      return;
    }
    interface JoinRoomResult {
      success: boolean;
      message?: string;
    }

    const username =
      user?.fullName ?? (await getLocal("guestName")) ?? "Não identificado";

    socketManager.emit(
      "join_room",
      { roomCode, username: String(username) },
      (result: JoinRoomResult) => {
        if (result?.success) {
          saveLocal(roomCode);
          router.push(`/(app)/(stack)/waitingRoom`);
        } else {
          toast.error(result?.message || "Sala cheia ou inválida.", {
            style: {
              backgroundColor: "#0072BB",
            },
          });
        }
      }
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView className="flex-1 w-full h-full items-center">
        <ScreenBackground />
        <AppLogo />

        <BlurredContainer>
          <PinInput
            placeholder="PIN DO JOGO"
            placeholderTextColor={"#B0B0B0"}
            value={roomCode}
            onChangeText={(text) => setRoomCode(text.toLocaleUpperCase())}
            maxLength={5}
          />
          <ActionButton
            onPress={handleJoinRoom}
            title="Enviar"
            buttonClassName="bg-primary-orange"
            textClassName="color-white"
          />
        </BlurredContainer>

        <OrDivider dividerClassName="my-4" />

        <View className="w-[90%] items-center justify-center">
          <ActionButton
            onPress={navigateToCreateRoom}
            title="Criar sala"
            buttonClassName="bg-primary-orange"
            textClassName="color-white"
          />
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
