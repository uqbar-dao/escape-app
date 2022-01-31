import React from "react";
import { FontAwesome } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import useColorScheme from "../hooks/useColorScheme";
import Colors from "../constants/Colors";

const HeaderBar = ({ navigation }: any) => {
  const colorScheme = useColorScheme();

  return (
    <View style={{ flexDirection: "row" }}>
      <Pressable
        onPress={() => navigation.navigate("Settings")}
        style={({ pressed }) => ({
          opacity: pressed ? 0.5 : 1,
        })}
      >
        <FontAwesome
          name="cog"
          size={25}
          color={Colors[colorScheme].text}
          style={{ marginRight: 15 }}
        />
      </Pressable>
    </View>
  );
};

export default HeaderBar;
