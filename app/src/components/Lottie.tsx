import { Platform } from "react-native";

let LottieComponent;

if (Platform.OS === "web") {
  const { default: Lottie } = require("lottie-react");
  LottieComponent = (props: any) => <Lottie {...props} />;
} else {
  const { default: Lottie } = require("lottie-react-native");
  LottieComponent = (props: any) => <Lottie {...props} />;
}

export default LottieComponent;
