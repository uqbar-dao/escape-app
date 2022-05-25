import React, { useMemo } from "react";
import Ionicons from '@expo/vector-icons/Ionicons';
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import useColorScheme from "../../hooks/useColorScheme";
import useStore from "../../state/useStore";
import { useThemeWatcher } from "../../hooks/useThemeWatcher";

const generateStyles = (colors: any) => StyleSheet.create({
  changeShip: {
    padding: 8
  },
  changeShipText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginLeft: 16,
  },
});

const ShipSelector = ({ navigation }: any) => {
  const { ship } = useStore();
  const { theme } = useThemeWatcher();
  const styles = useMemo(() => generateStyles(theme.colors), [theme.colors]);

  return (
    <Pressable style={styles.changeShip} onPress={() => navigation.navigate('Ships')}>
      <View style={{ display: 'flex', flexDirection: 'row' }}>
        <Ionicons name="swap-horizontal" size={20} color={theme.colors.black} />
        <Text style={styles.changeShipText}>{ship}</Text>
      </View>
    </Pressable>
  );
};

export default ShipSelector;
