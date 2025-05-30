import React from "react";
import * as WebBrowser from "expo-web-browser";

export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    // Aquece o navegador quando o componente que usa este hook é montado.
    void WebBrowser.warmUpAsync();

    // Resfria o navegador quando o componente é desmontado.
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []); // O array de dependências vazio garante que isso execute apenas na montagem e desmontagem.
};
