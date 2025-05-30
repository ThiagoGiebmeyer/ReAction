import Icon from "@/components/Icon";
import socketManager from "@/socket/socketManager";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getLocal, saveLocal } from "@/utils/roomSession";
import { toast } from "sonner-native";
import AppLogo from "@/components/AppLogo";
import ActionButton from "@/components/ActionButton";
import { SafeAreaView } from "react-native-safe-area-context";
import BlurredContainer from "@/components/BlurredContainer";
import Lottie from "@/components/Lottie";
import { useUser } from "@clerk/clerk-expo";

const difficultiesData = ["Fácil", "Médio", "Difícil"];
const themesData = ["Geral", "Ciências", "Tecnologia", "Geografia"];

type FormSectionTitleProps = {
  text: string;
  textClassName?: string;
  viewClassName?: string;
};

const FormSectionTitle: React.FC<FormSectionTitleProps> = ({
  text,
  textClassName = "",
  viewClassName = "",
}) => (
  <View className={`w-full my-4 items-center justify-center ${viewClassName}`}>
    <Text className={`color-white font-extrabold text-2xl ${textClassName}`}>
      {text}
    </Text>
  </View>
);

type TitledDividerProps = {
  title: string;
  titleClassName?: string;
  lineWidthClass?: string;
  lineClassName?: string;
  viewClassName?: string;
};

const TitledDivider: React.FC<TitledDividerProps> = ({
  title,
  titleClassName = "",
  lineWidthClass = "w-[10%]",
  lineClassName = "bg-white",
  viewClassName = "",
}) => (
  <View
    className={`w-full my-4 items-center justify-center flex-row ${viewClassName}`}
  >
    <View className={`h-[1px] ${lineWidthClass} ${lineClassName}`} />
    <Text
      className={`color-white font-extrabold text-2xl px-4 ${titleClassName}`}
    >
      {title}
    </Text>
    <View className={`h-[1px] ${lineWidthClass} ${lineClassName}`} />
  </View>
);

type NumberStepperProps = {
  value: number;
  onValueChange: (value: number) => void;
  minValue?: number;
  maxValue?: number;
  iconColor?: string;
};

const NumberStepper: React.FC<NumberStepperProps> = ({
  value,
  onValueChange,
  minValue = 1,
  maxValue = 20,
  iconColor = "white",
}) => {
  const handleDecrement = () => {
    onValueChange(Math.max(minValue, value - 1));
  };
  const handleIncrement = () => {
    onValueChange(Math.min(maxValue, value + 1));
  };

  return (
    <View className="flex-row w-full items-center justify-center bg-primary-sBlue rounded-md">
      <TouchableOpacity
        onPress={handleDecrement}
        className="justify-center items-center flex-1 p-4"
      >
        <Icon name="Minus" color={iconColor} />
      </TouchableOpacity>
      <View className="w-28 h-24 items-center justify-center">
        <Text className="color-white font-extrabold text-4xl">{value}</Text>
      </View>
      <TouchableOpacity
        onPress={handleIncrement}
        className="justify-center items-center flex-1 p-4"
      >
        <Icon name="Plus" color={iconColor} />
      </TouchableOpacity>
    </View>
  );
};

type SelectableButtonProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  buttonClassName?: string;
  textClassName?: string;
};

const SelectableButton: React.FC<SelectableButtonProps> = ({
  label,
  selected,
  onPress,
  buttonClassName = "",
  textClassName = "",
}) => {
  const getBackgroundColor = () => {
    if (!selected) return "bg-primary-green";

    switch (label.toLowerCase()) {
      case "fácil":
        return "bg-primary-yellow"; 
      case "médio":
        return "bg-primary-orange";
      case "difícil":
        return "bg-red-600";
      default:
        return "bg-primary-yellow";
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`py-2 rounded-md items-center ${getBackgroundColor()} ${buttonClassName}`}
    >
      <Text className={`font-extrabold text-2xl text-white ${textClassName}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

type OptionsSelectorProps = {
  items: string[];
  selectedItem: string;
  onSelectItem: (item: string) => void;
  horizontalLayout?: boolean;
  itemWrapperClassName?: string;
  groupClassName?: string;
  buttonClassName?: string;
};

const OptionsSelector: React.FC<OptionsSelectorProps> = ({
  items,
  selectedItem,
  onSelectItem,
  groupClassName = "",
  buttonClassName = "",
}) => (
  <View className={`${groupClassName}`}>
    {items.map((item, index) => (
      <SelectableButton
        key={String(item + index)}
        label={item}
        buttonClassName={buttonClassName}
        selected={selectedItem === item}
        onPress={() => onSelectItem(item)}
      />
    ))}
  </View>
);

const HorizontalDivider = ({
  dividerClassName = "bg-white",
  containerClassName = "my-4",
}) => (
  <View
    className={`w-full h-[1px] ${containerClassName} ${dividerClassName}`}
  />
);

export default function CreateRoom() {
  const router = useRouter();
  const { user } = useUser();

  const [countQuestions, setCountQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState("Fácil");
  const [theme, setTheme] = useState("Geral");
  const [loading, setLoading] = useState(false);

  const goBack = () => router.back();

  const handleCreateRoom = () => {
    setLoading(true);
    interface CreateRoomResponse {
      roomCode?: string;
      error?: string;
      [key: string]: any;
    }

    interface CreateRoomPayload {
      maxQuestions: number;
      topic: string;
      difficulty: string;
    }

    socketManager.emit(
      "create_room",
      {
        maxQuestions: countQuestions,
        topic: theme,
        difficulty,
      } as CreateRoomPayload,
      (response: CreateRoomResponse) => {
        if (response?.roomCode) {
          handleJoinRoom(response?.roomCode);
        } else {
          setLoading(false);
          toast.error("Erro ao criar sala.", {
            description: response?.error || "Tente novamente.",
          });
        }
      }
    );
  };

  const handleJoinRoom = async (roomCode: string) => {
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
      user?.fullName ?? await getLocal("guestName") ??  "Não identificado";

      socketManager.emit(
      "join_room",
      { roomCode, username: String(username) },
      (result: JoinRoomResult) => {
        setLoading(false);
        if (result?.success) {
          saveLocal(roomCode);
          router.push({
            pathname: "/waitingRoom",
            params: { isHost: "true" },
          });
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

  if (loading) {
    return (
      <ImageBackground
        source={require("@/assets/images/backgroundOrange.png")}
        className="flex-1"
      >
        <SafeAreaView className="flex-1 w-full h-full">
          <View className="flex-1 w-full h-full items-center justify-center">
            <BlurredContainer>
              <View className="w-full p-8 py-16 items-center justify-center">
                <Lottie
                  source={require("@/assets/animations/loadingAnimation.json")}
                  autoPlay
                  loop
                  style={{ width: 200, height: 200 }}
                />
                <Text className="color-white font-extrabold text-2xl mt-4">
                  Criando sala, aguarde...
                </Text>
              </View>
            </BlurredContainer>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require("@/assets/images/backgroundOrange.png")}
      className="flex-1"
    >
      <SafeAreaView className="flex-1 w-full h-full">
        <ScrollView
          className="flex-1 w-full h-full"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: "center",
          }}
        >
          <AppLogo />
          <BlurredContainer>
            <FormSectionTitle text="NÚMERO DE QUESTÕES" />
            <NumberStepper
              value={countQuestions}
              onValueChange={setCountQuestions}
              minValue={1}
              maxValue={20}
            />

            <TitledDivider title="DIFICULDADE" />
            <OptionsSelector
              items={difficultiesData}
              selectedItem={difficulty}
              onSelectItem={setDifficulty}
              groupClassName="w-full flex-row flex-wrap gap-2 justify-around"
              buttonClassName="w-[30%]"
            />

            <TitledDivider title="ASSUNTO" />
            <OptionsSelector
              items={themesData}
              selectedItem={theme}
              onSelectItem={setTheme}
              groupClassName="w-full flex-row flex-wrap justify-around gap-2 "
              buttonClassName="w-[48%]"
            />

            <ActionButton
              onPress={handleCreateRoom}
              title="Criar sala"
              buttonClassName="bg-primary-pBlue mt-4"
              textClassName="color-white"
              disabled={loading}
            />
          </BlurredContainer>

          <HorizontalDivider containerClassName="w-[90%] my-4" />

          <View className="w-[90%] items-center">
            <ActionButton
              onPress={goBack}
              title="Voltar"
              buttonClassName="bg-primary-orange"
              textClassName="color-white"
              disabled={loading}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}
