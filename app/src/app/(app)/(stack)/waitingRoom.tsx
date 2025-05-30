import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import socketManager from "@/socket/socketManager";
import { getLocal as fetchPersistedRoomId } from "@/utils/roomSession";
import BlurredContainer from "@/components/BlurredContainer";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

interface Player {
  id: string;
  username: string;
  isReady: boolean;
}

interface PlayersUpdatePayload {
  players: Player[];
  allReady?: boolean;
  playerId?: string;
  isReady?: boolean;
  username?: string;
}

interface HostChangedPayload {
  newHostId: string;
  players: Player[];
}

interface StartingGamePayload {
  cutdown: number;
  start: boolean;
}

interface GetPlayersCallbackData {
  success: boolean;
  players?: Player[];
  message?: string;
}

interface StartGameCallbackData {
  success: boolean;
  message?: string;
}

interface QuitRoomCallbackData {
  success: boolean;
  message?: string;
}

type WaitingViewProps = {
  roomCode: string | null;
  players: Player[];
  isHost: boolean;
  onGoBack: () => void;
  onStart: () => void;
  onReady?: (ready: boolean) => void;
  localPlayerReadyState?: boolean; // Renomeado para clareza
  allPlayersReady?: boolean; // Renomeado para clareza
};

const WaitingView = ({
  roomCode,
  players,
  isHost,
  onGoBack,
  onStart,
  onReady,
  localPlayerReadyState = false,
  allPlayersReady = false,
}: WaitingViewProps) => {
  const currentPlayer = players.find((p) => p.id === socketManager.socket?.id);
  const isCurrentUserReportedReady = currentPlayer?.isReady ?? false;

  return (
    <>
      <View className="w-full my-4 items-center justify-center">
        {isHost ? (
          <>
            <Text className="font-extrabold text-2xl text-primary-pBlue text-center">
              PIN DO JOGO
            </Text>
            <Text className="text-primary-pBlue text-lg text-center mt-1">
              Compartilhe o código com seus amigos!
            </Text>
          </>
        ) : (
          <>
            <Text className="font-extrabold text-2xl text-primary-pBlue text-center">
              Aguarde o host da sala iniciar...
            </Text>
          </>
        )}
      </View>

      <View className="w-full my-8 items-center justify-center rounded-md">
        <Text className="text-primary-pBlue font-extrabold text-6xl tracking-wider">
          {roomCode || "----"}
        </Text>
      </View>

      <View className="w-full my-4 border-t border-white/50" />

      <View className="w-full mb-4 min-h-[100px]">
        {players.length > 0 ? (
          <>
            <Text className="text-primary-pBlue text-2xl font-bold mb-2">
              Jogadores:
            </Text>
            {players.map((player) => {
              const isCurrentSocketUser =
                player.id === socketManager.socket?.id;
              return (
                <Text
                  key={player.id}
                  className={`text-lg font-semibold ${
                    player.isReady
                      ? "text-primary-green"
                      : "text-primary-orange"
                  }`}
                >
                  {player.username} -{" "}
                  {isCurrentSocketUser
                    ? player.isReady
                      ? "Você (Pronto)"
                      : "Você (Aguardando)"
                    : player.isReady
                    ? "Pronto"
                    : "Aguardando"}
                </Text>
              );
            })}
          </>
        ) : (
          <Text className="text-primary-pBlue text-lg font-bold mb-2 text-center">
            Aguardando jogadores...
          </Text>
        )}
      </View>

      <View className="w-full items-center justify-center flex-row gap-4">
        <TouchableOpacity
          className="p-3 flex-1 h-14 rounded-md items-center justify-center bg-primary-orange"
          onPress={onGoBack}
        >
          <Text className="font-bold text-lg color-white">Cancelar</Text>
        </TouchableOpacity>

        {!isHost && onReady && (
          <TouchableOpacity
            className={`p-3 flex-1 h-14 rounded-md items-center justify-center ${
              isCurrentUserReportedReady
                ? "bg-primary-yellow"
                : "bg-primary-green"
            }`}
            onPress={() => onReady(!localPlayerReadyState)}
          >
            <Text className="font-bold text-lg color-white">
              {isCurrentUserReportedReady ? "Não Estou Pronto" : "Estou Pronto"}
            </Text>
          </TouchableOpacity>
        )}

        {isHost && (
          <TouchableOpacity
            className={`p-3 flex-1 h-14 rounded-md items-center justify-center bg-primary-green ${
              !allPlayersReady || players.length < 1 ? "opacity-50" : "" // Ajustado para min 1 jogador (host) + 1 outro = 2 total
            }`}
            onPress={onStart}
            disabled={!allPlayersReady || players.length < 1}
          >
            <Text className="font-bold text-lg color-white">Iniciar</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
};

type CountdownViewProps = {
  seconds: number;
};

const CountdownView = ({ seconds }: CountdownViewProps) => (
  <View className="w-full my-8 items-center justify-center rounded-md">
    <Text className="text-primary-pBlue font-extrabold text-9xl">
      {seconds}
    </Text>
  </View>
);

export default function WaitingRoom() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roomCode?: string; isHost?: string }>();

  const [isCurrentUserHost, setIsCurrentUserHost] = useState<boolean>(
    params.isHost === "true"
  );
  const [displayedRoomCode, setDisplayedRoomCode] = useState<string | null>(
    params.roomCode || null
  );
  const [isLoadingRoomCode, setIsLoadingRoomCode] = useState<boolean>(
    !params.roomCode
  );
  const [countdown, setCountdown] = useState<number | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [localPlayerReadyState, setLocalPlayerReadyState] = useState(false);
  const [allPlayersReady, setAllPlayersReady] = useState(false);

  const handleGoBack = useCallback(() => {
    if (!displayedRoomCode) {
      router.back();
      return;
    }
    socketManager.emit(
      "quit_room",
      { roomCode: displayedRoomCode },
      (response: QuitRoomCallbackData) => {
        if (!response.success) {
          toast.error("Erro ao sair da sala", {
            description: response.message,
          });
        }
      }
    );
    router.back();
  }, [router, displayedRoomCode]);

  const handleStartGame = useCallback(() => {
    if (!displayedRoomCode || !allPlayersReady) return;

    socketManager.emit(
      "start_game",
      { roomCode: displayedRoomCode },
      (result: StartGameCallbackData) => {
        if (!result?.success) {
          toast.error("Ooops!", {
            description: result?.message || "Inconsistência ao iniciar o jogo.",
          });
        }
      }
    );
  }, [displayedRoomCode, allPlayersReady]);

  useEffect(() => {
    if (params.roomCode) {
      setDisplayedRoomCode(params.roomCode);
      setIsLoadingRoomCode(false);
      return;
    }

    const loadRoomId = async () => {
      setIsLoadingRoomCode(true);
      try {
        const id = await fetchPersistedRoomId();
        setDisplayedRoomCode(id);
        if (!id) router.replace("/(app)/(tabs)"); // Se não houver ID, volta
      } catch (error) {
        console.error("Erro ao buscar ID da sala:", error);
        toast.error("Erro", {
          description: "Não foi possível recuperar o ID da sala.",
        });
        router.replace("/(app)/(tabs)");
      } finally {
        setIsLoadingRoomCode(false);
      }
    };

    loadRoomId();
  }, [params.roomCode, router]);

  useEffect(() => {
    if (!displayedRoomCode || !socketManager.socket) return;

    socketManager.emit(
      "get_players",
      { roomCode: displayedRoomCode },
      (response: GetPlayersCallbackData) => {
        if (response.success && response.players) {
          setPlayers(response.players);
          const me = response.players.find(
            (p) => p.id === socketManager.socket?.id
          );
          if (me) setLocalPlayerReadyState(me.isReady);
        } else if (!response.success) {
          toast.error("Erro ao buscar jogadores", {
            description: response.message,
          });
          router.replace("/(app)/(tabs)");
        }
      }
    );

    const handlePlayersUpdate = (data: PlayersUpdatePayload) => {
      if (data.players) setPlayers(data.players);
      if (typeof data.allReady === "boolean") setAllPlayersReady(data.allReady);

      const me = data.players?.find((p) => p.id === socketManager.socket?.id);
      if (me) setLocalPlayerReadyState(me.isReady);
    };

    const handlePlayerLeft = (data: PlayersUpdatePayload) => {
      if (data.players) setPlayers(data.players);
      setAllPlayersReady(data?.allReady ?? false);
    };

    const handleHostChanged = (data: HostChangedPayload) => {
      if (socketManager.socket?.id === data.newHostId) {
        setIsCurrentUserHost(true);
        toast.info("Você é o novo Host!");
      }
      if (data.players) setPlayers(data.players);
    };

    const handleStartingGame = (data: StartingGamePayload) => {
      if (data?.start === true) {
        router.replace({
          pathname: "/inGame",
          params: { roomCode: displayedRoomCode },
        });
      } else if (typeof data?.cutdown === "number") {
        setCountdown(data.cutdown);
      }
    };

    const handleRoomError = (data: { message: string }) => {
      toast.error("Ooops!", { description: data.message });
      router.replace("/(app)/(tabs)");
    };

    socketManager.on("player_joined", handlePlayersUpdate);
    socketManager.on("player_left", handlePlayerLeft);
    socketManager.on("player_ready_updated", handlePlayersUpdate);
    socketManager.on("host_changed", handleHostChanged);
    socketManager.on("starting_game", handleStartingGame);
    socketManager.on("room_error", handleRoomError);

    return () => {
      socketManager.off("player_joined", handlePlayersUpdate);
      socketManager.off("player_left", handlePlayerLeft);
      socketManager.off("player_ready_updated", handlePlayersUpdate);
      socketManager.off("host_changed", handleHostChanged);
      socketManager.off("starting_game", handleStartingGame);
      socketManager.off("room_error", handleRoomError);
    };
  }, [displayedRoomCode, router]);

  const handleReadyToggle = useCallback(
    (newReadyState: boolean) => {
      setLocalPlayerReadyState(newReadyState);
      if (!displayedRoomCode) return;
      socketManager.emit("player_ready", {
        roomCode: displayedRoomCode,
        isReady: newReadyState,
      });
    },
    [displayedRoomCode]
  );

  return (
    <ImageBackground
      source={require("@/assets/images/backgroundWhite.png")}
      className="flex-1"
      resizeMode="cover"
    >
      <SafeAreaView className="flex-1 w-full h-full items-center justify-center px-4">
        <BlurredContainer>
          {isLoadingRoomCode ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : countdown !== null ? (
            <CountdownView seconds={countdown} />
          ) : (
            <WaitingView
              roomCode={displayedRoomCode}
              players={players}
              isHost={isCurrentUserHost}
              onGoBack={handleGoBack}
              onStart={handleStartGame}
              onReady={!isCurrentUserHost ? handleReadyToggle : undefined}
              localPlayerReadyState={localPlayerReadyState}
              allPlayersReady={allPlayersReady}
            />
          )}
        </BlurredContainer>
      </SafeAreaView>
    </ImageBackground>
  );
}
