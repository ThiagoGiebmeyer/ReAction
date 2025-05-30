import Icon from "@/components/Icon";
import { Tabs, usePathname } from "expo-router";
import { View } from "react-native";

export default function TabLayout() {
  const pathname = usePathname();

  const activeColor =
    pathname === "/profile" || pathname === "/ranking" ? "#E18335" : "#1E91D6";
  const inactiveColor =
    pathname === "/profile" || pathname === "/ranking" ? "white" : "white";
  const backgroundColor =
    pathname === "/profile" || pathname === "/ranking" ? "white" : "white";
  const backgroundTabBarColor =
    pathname === "/profile" || pathname === "/ranking"
      ? "bg-primary-orange"
      : "bg-primary-sBlue";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          borderTopWidth: 0,
          backgroundColor: "transparent",
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarHideOnKeyboard: true,
        tabBarBackground: () => (
          <View
            className={`absolute top-0 bottom-0 left-0 right-0 rounded-t-md  ${backgroundTabBarColor}`}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? backgroundColor : "transparent",
              }}
              className="px-[100%]  rounded-md mt-4 py-2 items-center"
            >
              <Icon
                name={"CircleUser"}
                color={focused ? activeColor : color}
                size={36}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? backgroundColor : "transparent",
              }}
              className="px-[100%] rounded-md mt-4 py-2 items-center"
            >
              <Icon
                name={"Gamepad2"}
                color={focused ? activeColor : color}
                size={36}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? backgroundColor : "transparent",
              }}
              className="px-[100%] rounded-md mt-4 py-2 items-center"
            >
              <Icon
                name={"Trophy"}
                color={focused ? activeColor : color}
                size={36}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
