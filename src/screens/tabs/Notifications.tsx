import React, { useCallback, useEffect } from 'react';
import { Button, StyleSheet } from 'react-native';
import { TouchableHighlight } from 'react-native-gesture-handler';
import { harkBinToId, HarkLid, Timebox } from '@urbit/api';

import { Notification } from '../../components/Notification';
import { Text, View } from '../../components/Themed';
import useColorScheme from '../../hooks/useColorScheme';
import useStore from '../../state/useStore';
import useHarkState, { HarkState } from '../../state/useHarkState';
import { Row } from '../../components/spacing/Row';
import { Col } from '../../components/spacing/Col';
import { useThemeWatcher } from '../../hooks/useThemeWatcher';
import { useNav } from '../../hooks/useNav';

export interface NotificationsProps {
  navigation: any
}

export function Notifications({
  navigation,
}: NotificationsProps) {
  const { theme: { colors } } = useThemeWatcher();
  const { navigate } = useNav();

  const goToNotification = (notificationUrl: string | { search: string }) => () => {
    navigate(notificationUrl);
  }

  return (
    <View style={{ display: 'flex', alignItems: 'center', flex: 1, backgroundColor: colors.white }}>
      <NewBox goToNotification={goToNotification} />
    </View>
  );
}


const unseenLid = { unseen: null };
const seenLid = { seen: null };
const selUnseen = (s: HarkState) => s.unseen;
const selSeen = (s: HarkState) => s.seen;
export function NewBox({ goToNotification, hideLabel = false }: { goToNotification: (n: string) => () => void; hideLabel?: boolean }) {
  const seen = useHarkState(selSeen);
  const unseen = useHarkState(selUnseen);
  const empty = Object.keys(seen).length + Object.keys(unseen).length === 0;// && pending.length === 0;

  return (
    <View style={{ paddingTop: 20 }}>
      {empty ? !hideLabel &&  (
        <Text style={{ padding: 8 }}>All clear!</Text>
      ) : (
        <>
          <Lid goToNotification={goToNotification} lid={unseenLid} timebox={unseen} title="Unseen" showButton />
          <Lid goToNotification={goToNotification} lid={seenLid} timebox={seen} title="Seen" />
        </>
      )}
    </View>
  );
}


function Lid({
  lid,
  timebox,
  title,
  goToNotification,
  showButton = false
}: {
  lid: HarkLid;
  timebox: Timebox;
  title: string;
  goToNotification: (n: string) => () => void;
  showButton?: boolean;
}) {
  const markAllRead = useCallback(() => {
    useHarkState.getState().opened();
  }, []);

  if (Object.keys(timebox).length === 0) {
    return null;
  }
  return (
    <>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={{ padding: 4 }}>
          {title}
        </Text>
        {showButton && <Button title='Mark All Read' onPress={markAllRead} />}
      </Row>
      <Col>
        {Object.entries(timebox)
          .sort(([, a], [, b]) => b.time - a.time)
          .map(([binId, n]) => (
            <Notification key={harkBinToId(n.bin)} goToNotification={goToNotification} lid={lid} notification={n} />
          ))}
      </Col>
    </>
  );
}
