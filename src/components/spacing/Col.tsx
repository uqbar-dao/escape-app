import { StyleSheet, ViewProps } from 'react-native';
import { View } from '../Themed';

export interface ColProps extends ViewProps {
  style?: Object
}

export function Col({ style, ...rest }: ColProps) {
  return <View {...rest} style={{ display: 'flex', flexDirection: 'column', ...style }} />
}
