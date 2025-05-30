import React from "react";
import { View, Text } from "react-native";

interface OrDividerProps {
  dividerClassName?: string;
  showText?: boolean;
  width?: string;
}

const OrDivider = ({
  dividerClassName = "",
  showText = true,
  width = "100%",
}: OrDividerProps) => (
  <View
    className={`w-[${width}] items-center justify-center flex-row ${dividerClassName}`}
  >
    {showText ? (
      <>
        <View className="h-[1px] flex-1 bg-white" />
        <Text className="color-white font-extrabold text-2xl px-4">ou</Text>
        <View className="h-[1px] flex-1 bg-white" />
      </>
    ) : (
      <>
        <View className="h-[1px] flex-1 bg-white" />
      </>
    )}
  </View>
);

export default OrDivider;
