import { Slot, Stack, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { getLocal } from "@/utils/roomSession";
import socketManager from "@/socket/socketManager";

export default function Layout() {
  const router = useRouter();

  useEffect(() => {
    socketManager.connect();
    return () => {
      socketManager.disconnect();
    };
  }, []);

  useEffect(() => {
    const checkRoomStatus = async () => {
      try {
        // const roomId = await getLocal();
        // if (roomId) {
        //   router.replace("/inGame");
        // }
      } catch (error) {
        console.error("Erro ao verificar sala atual:", error);
      }
    };

    checkRoomStatus();
  }, []);

  return <Slot />;
}
