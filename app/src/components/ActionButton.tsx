import React from "react";
import { Text, TouchableOpacity } from "react-native";

type ActionButtonProps = {
  onPress: () => void;
  title: string;
  buttonClassName?: string;
  textClassName?: string;
  disabled?: boolean;
};

const ActionButton = ({
  onPress,
  title,
  buttonClassName = "",
  textClassName = "",
  disabled = false,
}: ActionButtonProps) => (
  <TouchableOpacity
    className={`p-4 w-full rounded-sm items-center justify-center ${buttonClassName}`}
    onPress={onPress}
    disabled={disabled}
  >
    <Text className={`font-bold text-2xl ${textClassName}`}>{title}</Text>
  </TouchableOpacity>
);

export default ActionButton;
