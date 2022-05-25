import dark from '../util/dark';
import light from '../util/light';
import { useEffect } from 'react';
import chroma from 'chroma-js';
import { cloneDeep } from 'lodash';
import useLocalState, { selectLocalState } from '../state/useLocalState';
import useSettingsState, { selectDisplayState } from '../state/useSettingsState';
import useStore from '../state/useStore';

const selLocal = selectLocalState(['dark', 'set']);

export function useThemeWatcher() {
  const { ship } = useStore();
  const { set, dark: isDark } = useLocalState(ship)(selLocal);
  const display = useSettingsState(selectDisplayState);

  const getTheme = () => {
    if (display.theme === 'custom') {
      const valid = /^#[0-9A-F]{6}$/i;
      const clonedLight = cloneDeep(light);
      clonedLight.fonts.sans = display.sans;
      clonedLight.colors.black = valid.test(display.black)
        ? display.black
        : '#000000';
      clonedLight.colors.washedGray = `rgba(${chroma(
        valid.test(display.black) ? display.black : '#000000'
      )
        .alpha(0.25)
        .rgba()
        .toString()})`;
      clonedLight.colors.lightGray = `rgba(${chroma(
        valid.test(display.black) ? display.black : '#000000'
      )
        .alpha(0.5)
        .rgba()
        .toString()})`;
      clonedLight.colors.gray = `rgba(${chroma(
        valid.test(display.black) ? display.black : '#000000'
      )
        .alpha(0.75)
        .rgba()
        .toString()})`;
      clonedLight.colors.white = display.white;
      clonedLight.borders = ['none', display.border];
      return clonedLight;
    }
    return (isDark && display?.theme == 'auto') ||
      display?.theme == 'dark'
      ? dark
      : light;
  };

  const theme = getTheme();

  return {
    display,
    theme
  };
}
