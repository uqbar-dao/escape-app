import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import useColorScheme from "../../hooks/useColorScheme";
import useStore from "../../hooks/useStore";

const GridSelector = ({ navigation }: any) => {
  const { ship, setPath } = useStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const goToGrid = () => {
    setPath(ship, '/apps/grid/');
  }

  return (
    <Pressable style={styles.changeShip} onPress={goToGrid}>
      <View style={{ display: 'flex', flexDirection: 'row' }}>
        <Ionicons name="apps" size={20} color={isDark ? 'white' : 'black'} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  changeShip: {
    padding: 8
  },
});

export default GridSelector;
