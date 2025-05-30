import { Stack } from "expo-router";
import { Text, View } from "react-native";


export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View className="flex-1 items-center justify-center bg-primary-pBlue">
        <Text className="">Essa página não existe.</Text>
      </View>
    </>
  );
}
