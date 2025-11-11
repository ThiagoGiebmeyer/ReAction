import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Icon from "./Icon";

export default function PdfList({
  files,
  onRemove,
}: {
  files: Array<{ name: string }>;
  onRemove: (index: number) => void;
}) {
  if (files.length === 0) return null;
  return (
    <View className="w-full mt-2">
      {files.map((file, index) => (
        <View
          key={file.uri}
          className="flex-row items-center justify-between bg-primary-sBlue rounded-md p-3 mb-2"
        >
          <Text className="color-white flex-1 mr-2" numberOfLines={1}>
            {file.name}
          </Text>
          <TouchableOpacity onPress={() => onRemove(index)}>
            <Icon name="X" color="white" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}
