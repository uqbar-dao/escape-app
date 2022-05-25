import React from "react";
import Ionicons from '@expo/vector-icons/Ionicons';
import { TouchableOpacity, StyleSheet, View } from "react-native";
import useColorScheme from "../../hooks/useColorScheme";
import useStore from "../../state/useStore";

const GridSelector = ({ navigation }: any) => {
  const { ship, setPath } = useStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const goToGrid = () => {
    setPath(ship, '/apps/grid/');
    navigation.navigate('Tabs', { screen: 'Home' });
  }

  return (
    <TouchableOpacity style={styles.changeShip} onPress={goToGrid}>
      <View style={{ display: 'flex', flexDirection: 'row' }}>
        <Ionicons name="apps" size={20} color={isDark ? 'white' : 'black'} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  changeShip: {
    padding: 8
  },
});

export default GridSelector;
