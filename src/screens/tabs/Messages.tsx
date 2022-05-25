import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { GroupsList } from '../../components/chat/List';
import { BLUE } from '../../components/nav/UnreadIndicator';

import { View } from '../../components/Themed';
import { useApi } from '../../hooks/useApi';
import { useThemeWatcher } from '../../hooks/useThemeWatcher';
import useStore from '../../state/useStore';

export interface MessagesProps {
  navigation: any
}

export function Messages({
  navigation
}: MessagesProps) {
  const { theme } = useThemeWatcher();
  const styles = getStyles(theme);
  const { bootstrap } = useApi();

  const refresh = useCallback(bootstrap, [bootstrap]);

  return (
    <View style={styles.view}>
      <GroupsList refresh={refresh} isMessages />
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('NewDm')}>
        <Ionicons name="add" color="white" size={30} style={{ marginLeft: 2, marginTop: 1 }} />
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  view: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: theme.colors.white,
    width: '100%',
    paddingBottom: 8,
  },
  button: {
    backgroundColor: BLUE,
    width: 48,
    height: 48,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    position: 'absolute',
    right: 30,
    bottom: 24,
  },
  logo: {
    height: 24
  }
});
