import { Image, View } from "react-native";

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-primary-pBlue">
      <View className="w-4/12 h-1/3 items-center justify-center">
        <Image
          source={require("@/assets/images/icon.png")}
          className="flex-1 w-full h-full"
          resizeMode="contain"
        />
      </View>
    </View>
  );
}
