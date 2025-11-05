import React, { useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

export function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS !== "web") {
      void WebBrowser.warmUpAsync();

      return () => {
        void WebBrowser.coolDownAsync();
      };
    }
  }, []);
}
