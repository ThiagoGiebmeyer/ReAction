import React from "react";
import { BlurView } from "expo-blur";
import { Platform } from "react-native";

type BlurredContainerProps = {
  children: React.ReactNode;
  intensity?: number;
  tint?: "light" | "dark" | "default";
  containerClassName?: string;
};

const BlurredContainer: React.FC<BlurredContainerProps> = ({
  children,
  intensity = Platform.OS === "ios" ? 20 : 40,
  tint = "light",
  containerClassName = "",
}) => (
  <BlurView
    intensity={intensity}
    tint={tint}
    pointerEvents="box-none"
    className={`w-[90%] p-4 items-center justify-center rounded-md ${containerClassName}`}
  >
    {children}
  </BlurView>
);

export default BlurredContainer;
