import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import socketManager from "@/socket/socketManager";
import { clearLocal } from "@/utils/roomSession";
import Icon from "@/components/Icon";
import BlurredContainer from "@/components/BlurredContainer";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

type TitleTextProps = {
  text: string;
  textClassName?: string;
  viewClassName?: string;
};

const TitleText = ({
  text,
  textClassName = "color-white font-bold text-2xl text-justify",
  viewClassName = "w-full my-4 items-center justify-center",
}: TitleTextProps) => (
  <View className={viewClassName}>
    <Text className={textClassName}>{text}</Text>
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

type QuestionDisplayProps = {
  index: number;
  text: string;
};

const QuestionDisplay = ({ index, text }: QuestionDisplayProps) => (
  <BlurredContainer containerClassName="gap-0">
    <TitleText
      text={`PERGUNTA #${index}`}
      textClassName="color-white font-extrabold text-sm mb-2"
      viewClassName="my-0"
    />
    <Text className="color-white font-bold text-2xl text-center">
      {text || "Carregando pergunta..."}
    </Text>
  </BlurredContainer>
);

type AnswerButtonProps = {
  text: string;
  onPress: () => void;
};

const AnswerButton = ({ text, onPress }: AnswerButtonProps) => (
  <TouchableOpacity
    className="bg-primary-orange rounded-md p-4 w-full items-center justify-center flex-1 min-h-[70px]"
    onPress={onPress}
  >
    <Text className="color-white font-bold text-sm md:text-lg text-justify">
      {text}
    </Text>
  </TouchableOpacity>
);

type AnswerOptionsListProps = {
  options: string[];
  onSelectAnswer: (index: number) => void;
};

const AnswerOptionsList = ({
  options,
  onSelectAnswer,
}: AnswerOptionsListProps) => (
  <BlurredContainer containerClassName="gap-4 flex-1">
    {options?.map((optionText, idx) => (
      <AnswerButton
        key={idx}
        text={optionText}
        onPress={() => onSelectAnswer(idx)}
      />
    ))}
  </BlurredContainer>
);

type ScoreRowDisplayProps = {
  rank: number;
  username: string;
  score: number;
  isWinner: boolean;
};

type HistoryItem = {
  questionIndex: number;
  questionText: string;
  playerId: string;
  userId?: string;
  username: string;
  userAnswer: number;
  answerText: string;
  correctAnswer: number;
  isCorrect: boolean;
};

type HistoryRowDisplayProps = {
  data: HistoryItem;
  currentPlayerId?: string;
};

const ScoreRowDisplay = ({
  rank,
  username,
  score,
  isWinner,
}: ScoreRowDisplayProps) => (
  <View className="bg-primary-orange rounded-md p-4 w-full flex-row items-center justify-between mb-2">
    <View className="flex-1 flex-row items-center gap-2 mr-2">
      {isWinner ? (
        <Icon name="Crown" color="yellow" size={24} />
      ) : (
        <Icon name="Award" color="silver" size={24} />
      )}
      <Text
        className="color-white font-extrabold text-2xl flex-shrink"
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {rank}º - {username}
      </Text>
    </View>
    <Text className="color-white font-bold text-2xl text-right whitespace-nowrap">
      | {score} pontos
    </Text>
  </View>
);

const HistoryRowDisplay = ({
  data,
  currentPlayerId,
}: HistoryRowDisplayProps) => {
  const isCurrentUser = data.playerId === currentPlayerId;
  const isUserCorrect = isCurrentUser && data.isCorrect;

  return (
    <View
      className={`${
        isUserCorrect ? "bg-primary-green" : "bg-primary-orange"
      } rounded-md p-4 mb-2 w-full`}
    >
      <View className="flex-row w-full gap-2 items-center">
        <Text className="color-white font-extrabold text-2x1 flex-shrink text-justify">
          {data.questionIndex + 1}#: {data.questionText}
        </Text>
      </View>
      <HorizontalDivider containerClassName="w-[50%] my-4" />

      <Text className="text-white text-lg italic text-justify">
        {data.username} respondeu: {data.userAnswer + 1}. {data.answerText}
      </Text>
      <HorizontalDivider containerClassName="w-[50%] my-4" />

      <Text className="text-mb text-white text-justify">
        Resposta correta: {data.correctAnswer + 1}. {data.answerText}
      </Text>
    </View>
  );
};

type ScoreItem = {
  playerId: string;
  username: string;
  score: number;
};

const RankingListDisplay = ({ scoresData = [] as ScoreItem[] }) => (
  <BlurredContainer containerClassName="gap-2 max-h-[40%]">
    <TitleText
      text="RANKING FINAL"
      viewClassName="my-2"
      textClassName="color-white font-bold text-xl"
    />
    <ScrollView>
      {scoresData?.map((scoreItem, index) => (
        <ScoreRowDisplay
          key={scoreItem.playerId}
          rank={index + 1}
          username={scoreItem.username}
          score={scoreItem.score}
          isWinner={index === 0}
        />
      ))}
    </ScrollView>
  </BlurredContainer>
);

const HistoryListDisplay = ({
  historyData = [] as HistoryItem[],
  currentPlayerId,
}: {
  historyData: HistoryItem[];
  currentPlayerId?: string;
}) => (
  <BlurredContainer containerClassName="gap-2 flex-1 mb-2">
    <TitleText
      text="HISTÓRICO DE RESPOSTAS"
      viewClassName="my-2"
      textClassName="color-white font-bold text-xl"
    />
    <ScrollView className="h-full w-full" showsVerticalScrollIndicator={false}>
      {historyData?.map((historyItem, index) => (
        <HistoryRowDisplay
          key={`${historyItem.questionIndex}-${historyItem.userId}-${index}`}
          data={historyItem}
          currentPlayerId={currentPlayerId}
        />
      ))}
    </ScrollView>
  </BlurredContainer>
);

type ExitButtonProps = {
  onPress: () => void;
  title?: string;
  buttonClassName?: string;
};

const ExitButton = ({
  onPress,
  title = "Sair",
  buttonClassName = "",
}: ExitButtonProps) => (
  <TouchableOpacity
    className={`p-2 h-12 rounded-sm items-center justify-center w-[50%] ${buttonClassName}`}
    onPress={onPress}
  >
    <Text className="font-bold text-2xl color-white">{title}</Text>
  </TouchableOpacity>
);

const HorizontalLine = ({
  lineClassName = "bg-white",
  containerClassName = "w-full my-4",
}) => (
  <View className={containerClassName}>
    <View className={`h-[1px] w-full ${lineClassName}`} />
  </View>
);

interface QuestionState {
  question: string;
  options: string[];
}

interface NewQuestionPayload {
  question: {
    index: number;
    question: string;
    options: string[];
  };
  scores?: ScoreItem[];
}

interface GameOverPayload {
  scores: ScoreItem[];
  answerHistory: HistoryItem[];
  message?: string;
}

interface AnswerSubmissionPayload {
  roomCode: string;
  answer: number;
}

interface AnswerCallbackData {
  success: boolean;
  correct?: boolean;
  currentScore?: number;
  message?: string;
}

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roomCode?: string }>();

  const [question, setQuestion] = useState<QuestionState | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [scores, setScores] = useState<ScoreItem[] | null>(null);
  const [answerHistory, setAnswerHistory] = useState<HistoryItem[] | null>(
    null
  );
  const [roomCode, setRoomCode] = useState<string | null>(
    params.roomCode || null
  );

  const currentPlayerId = socketManager.socket?.id;

  const quit = useCallback(async () => {
    if (roomCode && socketManager.socket?.active) {
      socketManager.emit("quit_room", { roomCode }, () => {});
    }
    await clearLocal();
    setRoomCode(null);
    setQuestion(null);
    setScores(null);
    setAnswerHistory(null);
    setIsGameFinished(false);
    setCurrentIndex(0);
    router.replace("/(app)/(tabs)");
  }, [roomCode, router]);

  const confirmAndExitGame = useCallback(async () => {
    if (isGameFinished) {
      return quit();
    }
    return Alert.alert("Atenção!", "Deseja realmente sair da sala?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Sair",
        style: "destructive",
        onPress: quit,
      },
    ]);
  }, [isGameFinished, quit]);

  useEffect(() => {
    if (!roomCode) {
      return;
    }

    const handleNewQuestion = (data: NewQuestionPayload) => {
      if (data && data.question) {
        const quest = data.question;
        setCurrentIndex(quest.index ?? 0);
        setQuestion({
          question: quest.question,
          options: quest.options,
        });
        if (data.scores) {
          setScores(data.scores);
        }
      }
    };

    const handleGameOver = (data: GameOverPayload) => {
      if (data) {
        setScores(data.scores);
        setAnswerHistory(data.answerHistory);
      }
      setIsGameFinished(true);
    };

    socketManager.on("new_question", handleNewQuestion);
    socketManager.on("game_over", handleGameOver);

    return () => {
      socketManager.off("new_question", handleNewQuestion);
      socketManager.off("game_over", handleGameOver);
    };
  }, [roomCode, router, quit]);

  const handleAnswerSubmission = useCallback(
    (answerIndex: number) => {
      if (roomCode && socketManager.socket?.active) {
        socketManager.emit(
          "answer",
          {
            roomCode,
            answer: answerIndex,
          } as AnswerSubmissionPayload,
          (response: AnswerCallbackData) => {
            if (response.success) {
              console.log("Resposta processada pelo servidor:", response);
            } else {
              toast.error("Erro", {
                description:
                  response.message || "Não foi possível registrar a resposta.",
              });
            }
          }
        );
      } else {
        toast.warning("Problema de Conexão", {
          description: "Não foi possível enviar a resposta.",
        });
      }
    },
    [roomCode]
  );

  const GamePlayView = () => (
    <>
      {question && (
        <QuestionDisplay index={currentIndex} text={question.question} />
      )}
      {(question?.options?.length ?? 0) > 0 && (
        <AnswerOptionsList
          options={question?.options ?? []}
          onSelectAnswer={handleAnswerSubmission}
        />
      )}
      <HorizontalLine containerClassName="w-full my-2" />
      <ExitButton
        onPress={confirmAndExitGame}
        buttonClassName="bg-red-500/80 mb-4"
      />
    </>
  );

  const GameFinishView = () => (
    <View className="flex-1 w-full items-center justify-start pt-4">
      {scores && <RankingListDisplay scoresData={scores} />}
      <HorizontalLine containerClassName="w-full my-2" />
      {answerHistory && (
        <HistoryListDisplay
          historyData={answerHistory}
          currentPlayerId={currentPlayerId}
        />
      )}
      <View className="mt-auto w-full items-center pb-4">
        <ExitButton
          onPress={confirmAndExitGame}
          title="Voltar ao Início"
          buttonClassName="bg-primary-orange"
        />
      </View>
    </View>
  );

  if (!roomCode) {
    return (
      <ImageBackground
        source={require("@/assets/images/backgroundBlue.png")}
        className="flex-1 justify-center items-center"
        resizeMode="cover"
      >
        <Text className="text-white text-xl">Carregando dados da sala...</Text>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require("@/assets/images/backgroundBlue.png")}
      className="flex-1"
      resizeMode="cover"
    >
      <SafeAreaView className="flex-1 w-full h-full items-center px-4">
        {isGameFinished ? <GameFinishView /> : <GamePlayView />}
      </SafeAreaView>
    </ImageBackground>
  );
}
