import { stringRenderer, sigil } from '@tlon/sigil-js';
import React, { memo } from 'react';
import { SvgXml } from 'react-native-svg';
import { btoa } from '../util/base64';
import { View } from './Themed';

export const foregroundFromBackground = (background: string) => {
  const rgb = {
    r: parseInt(background.slice(1, 3), 16),
    g: parseInt(background.slice(3, 5), 16),
    b: parseInt(background.slice(5, 7), 16)
  };
  const brightness = (299 * rgb.r + 587 * rgb.g + 114 * rgb.b) / 1000;
  const whiteBrightness = 255;

  return whiteBrightness - brightness < 50 ? 'black' : 'white';
};

interface SigilProps {
  color: string;
  ship: string;
  size: number;
  svgClass?: string;
  foreground?: string;
  padding?: number;
  icon?: boolean;
}

export const Sigil = memo(
  ({
    color,
    foreground = '',
    ship,
    size,
    svgClass = '',
    icon = false,
    padding = 2,
  }: SigilProps) => {
    const innerSize = size - 2 * padding;
    const foregroundColor = foreground
      ? foreground
      : foregroundFromBackground(color);

    return ship.length > 14 ? (
      <View style={{
        backgroundColor: color,
        borderRadius: icon ? 2 : 0,
        height: size,
        width: size,
      }} />
    ) : (
      <View style={{
        borderRadius: icon ? 2 : 0,
        height: size,
        width: size,
        backgroundColor: color,
        padding,
      }}>
        {<SvgXml
          width="100%"
          height="100%"
          xml={sigil({
            patp: ship,
            renderer: stringRenderer,
            size: innerSize,
            icon,
            colors: [color, foregroundColor],
            class: svgClass
          })}
        />}
      </View>
    );
  }
);

Sigil.displayName = 'Sigil';

export default Sigil;
