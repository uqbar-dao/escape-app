import { Ref } from 'react';
import { StyleSheet, ViewComponent, ViewProps } from 'react-native';
import { View } from '../Themed';

export interface RowProps extends ViewProps {
  style?: Object
  ref?: Ref<ViewComponent>
}

export function Row({ style, ref, ...rest }: RowProps) {
  return <View ref={ref} {...rest} style={{ display: 'flex', flexDirection: 'row', ...style }} />
}
