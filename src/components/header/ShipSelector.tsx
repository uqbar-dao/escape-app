import React, { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import useColorScheme from "../../hooks/useColorScheme";
import useStore from "../../hooks/useStore";

const generateStyles = (dark: boolean) => StyleSheet.create({
  changeShip: {
    padding: 8
  },
  changeShipText: {
    fontSize: 16,
    fontWeight: '700',
    color: dark ? 'white' : 'black',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginLeft: 16,
  },
});

const ShipSelector = ({ navigation }: any) => {
  const { ship } = useStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = useMemo(() => generateStyles(isDark), [isDark]);

  return (
    <Pressable style={styles.changeShip} onPress={() => navigation.navigate('Ships')}>
      <View style={{ display: 'flex', flexDirection: 'row' }}>
        <Ionicons name="swap-horizontal" size={20} color={isDark ? 'white' : 'black'} />
        <Text style={styles.changeShipText}>{ship}</Text>
      </View>
    </Pressable>
  );
};

export default ShipSelector;
