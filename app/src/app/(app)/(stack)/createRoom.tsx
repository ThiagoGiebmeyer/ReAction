import ActionButton from "@/components/ActionButton";
import AppLogo from "@/components/AppLogo";
import BlurredContainer from "@/components/BlurredContainer";
import Icon from "@/components/Icon";
import Lottie from "@/components/Lottie";
import PdfList from "@/components/PdfList";
import socketManager from "@/socket/socketManager";
import { getLocal, saveLocal } from "@/utils/roomSession";
import { useUser } from "@clerk/clerk-expo";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ImageBackground,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

const difficultiesData = ["Fácil", "Médio", "Difícil"];

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
      className={`color-white font-extrabold text-2xl px-4 text-center ${titleClassName}`}
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
  const handleDecrement = () => onValueChange(Math.max(minValue, value - 1));
  const handleIncrement = () => onValueChange(Math.min(maxValue, value + 1));

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

type CustomTextInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
};

const CustomTextInput: React.FC<CustomTextInputProps> = ({
  value,
  onChangeText,
  placeholder = "",
  maxLength = 50,
}) => (
  <View className="w-full bg-primary-sBlue rounded-md px-4 py-3">
    <TextInput
      placeholderTextColor={"#B0B0B0"}
      className="bg-white p-6 w-full rounded-sm text-primary-orange font-bold text-xl "
      autoCapitalize="characters"
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType="default"
      maxLength={maxLength}
    />
  </View>
);

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
  const [theme, setTheme] = useState("SOBRE O MATERIAL DE APOIO");
  const [files, setFiles] = useState<Array<{ name: string; uri: string }>>([]);
  const [loading, setLoading] = useState(false);

  const goBack = () => router.back();

  const handleSelectPdf = async () => {
    try {
      if (files.length >= 3) {
        toast.error("Você pode adicionar no máximo 3 arquivos PDF.");
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        multiple: false,
      });

      if (!result.canceled && result.assets[0]) {
        const picked = result.assets[0];
        const isPdf = picked.name.toLowerCase().endsWith(".pdf");

        if (!isPdf) {
          toast.error("Apenas arquivos PDF são permitidos.");
          return;
        }

        const newFile = { name: picked.name, uri: picked.uri };
        setFiles((prev) => [...prev, newFile]);
      }
    } catch {
      toast.error("Não foi possível selecionar o arquivo PDF.");
    }
  };

  const handleRemovePdf = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPdfs = async () => {
    if (files.length === 0) return [];

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", {
        uri: file.uri,
        name: file.name,
        type: "application/pdf",
      } as any);
    });

    const SERVER_URL = "http://10.1.1.187:3001";
    await fetch(`${SERVER_URL}/upload/all`, {
      method: "DELETE",
    });

    const response = await fetch(`${SERVER_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Erro ao enviar arquivos");
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || "Falha no upload");
    }

    return result.files; // [{ name, url }]
  };

  const handleCreateRoom = async () => {
    try {
      setLoading(true);

      const uploadedFiles = await uploadPdfs();

      socketManager.emit(
        "create_room",
        {
          maxQuestions: countQuestions,
          topic: theme,
          difficulty,
          files: uploadedFiles,
        },
        (response: {
          success?: boolean;
          roomCode?: string;
          message?: string;
        }) => {
          setLoading(false);
          if (response?.success && response.roomCode) {
            handleJoinRoom(response?.roomCode);
          } else {
            toast.error(response?.message || "Erro ao criar sala.");
          }
        }
      );
    } catch (error: any) {
      setLoading(false);
      console.error("Erro ao criar sala:", error);
      toast.error(error.message || "Erro inesperado ao criar sala.");
    }
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
      user?.fullName ?? (await getLocal("guestName")) ?? "Não identificado";

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
            <CustomTextInput
              value={theme}
              onChangeText={(e) => setTheme(e.toUpperCase())}
              placeholder="Digite o assunto da sala..."
              maxLength={50}
            />

            <TitledDivider title="MATERIAL DE APOIO" />
            <ActionButton
              onPress={handleSelectPdf}
              title={`Adicionar PDF (${files.length}/3)`}
              buttonClassName="bg-primary-green"
              textClassName="color-white"
              disabled={files.length >= 3 || loading}
            />

            <PdfList files={files} onRemove={handleRemovePdf} />

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
              buttonClassName="bg-transparent "
              textClassName="color-white"
              disabled={loading}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}
