import React from 'react';
import { reactRenderer, sigil } from '@tlon/sigil-js';
import { useColorScheme, View } from 'react-native';

/*

THIS DOES NOT WORK CURRENTLY

*/

interface SigilProps {
  ship: string;
  size?: number;
  icon?: boolean;
  padding?: number;
  display?: 'none' | 'flex';
}

export const Sigil =({
  ship,
  size = 40,
  icon = false,
  padding = 0,
  display
}: SigilProps) => {
  const innerSize = Number(size) - 2 * padding;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const color = isDark ? 'white' : 'black';
  const foregroundColor = isDark ? 'black' : 'white';

  return ship.length > 14 ? (
    <View
      style={{
        backgroundColor: color,
        display: display,
        height: size,
        width: size,
      }}
    />
  ) : (
    <View
      style={{
        backgroundColor: color,
        display: display,
        height: size,
        width: size,
        flexBasis: size,
      }}
    >
      {sigil({
        patp: ship,
        renderer: reactRenderer,
        size: innerSize,
        icon,
        colors: [color, foregroundColor],
      })}
    </View>
  );
}

Sigil.displayName = 'Sigil';

export default Sigil;
