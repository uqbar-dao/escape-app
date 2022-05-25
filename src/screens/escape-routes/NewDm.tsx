import { createUnmanagedGraph } from '@urbit/api';
import _ from 'lodash';
import React, { ReactElement, useState } from 'react';
import { dateToDa, deSig } from '../../util/landscape';
import { ShipSearch } from '../../components/form/ShipSearch';
import useStore from '../../state/useStore';
import { Col } from '../../components/spacing/Col';
import { useThemeWatcher } from '../../hooks/useThemeWatcher';
import { H3 } from '../../components/html/Headers';
import { Button, View } from 'react-native';
import { PropFunc } from '../../components/graph/GraphContent';
import useGroupState from '../../state/useGroupState';
import { useApi } from '../../hooks/useApi';
import { useWaitForProps } from '../../hooks/useWaitForProps';
import { useNav } from '../../hooks/useNav';

type NewChannelProps = {
  navigation: any;
} & PropFunc<typeof Col>;

export function NewDm({ navigation }: NewChannelProps): ReactElement {
  const { ship, setCurrentPath } = useStore();
  const { theme } = useThemeWatcher();
  const { groups } = useGroupState();
  const { api } = useApi();
  const nav = useNav();
  const waiter = useWaitForProps({ groups }, 5000);
  const [ships, setShips] = useState<string[]>([]);

  const channelName = (ships: string[]) => {
    const joinedShips = ships
      .filter(Boolean)
      .map((ship: string) => `~${deSig(ship)}`)
      .join(', ')
      .concat(`, ~${deSig(ship)}`);
    return joinedShips;
  };

  const navToPath = (path: string) => {
    navigation.goBack();
    setTimeout(() => nav.navigate(path), 500);
  }

  const onSubmit = async () => {
    const name = channelName(ships);
    const resId: string = dateToDa(new Date());
    const description = '';
    const moduleType = 'chat';

    try {
      if (ships.length === 1) {
        return navToPath(`/~landscape/messages/dm/~${deSig(ships[0])}`);
      }
      await api?.thread(createUnmanagedGraph(
        deSig(ship),
        resId,
        name,
        description,
        { invite: { pending: ships.map(s => `~${deSig(s)}`) } },
        moduleType
      ));

      await waiter((p: any) => Boolean(p.groups?.[`/ship/${ship}/${resId}`]));
      navToPath(`~landscape/messages/resource/${moduleType}/ship/${ship}/${resId}`);
    } catch (e) {
      console.warn('CHANNEL CREATION FAILED:', e);
    }
  };

  return (
    <Col style={{ padding: 8, backgroundColor: theme.colors.white, justifyContent: 'space-between', height: '100%' }}>
      <ShipSearch id='ships' label='Invitees' selected={ships} setSelected={setShips} />
      <Col>
        <Button title="Create" onPress={onSubmit} />
        <View style={{ marginTop: 16 }} />
        <Button title="Go Back" onPress={() => navigation.goBack()} />
        <View style={{ marginTop: 24 }} />
      </Col>
    </Col>
  );
}
