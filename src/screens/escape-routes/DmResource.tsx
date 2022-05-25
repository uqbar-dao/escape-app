import React, { useCallback, useEffect } from 'react';
import bigInt from 'big-integer';
import shallow from 'zustand/shallow';
import { patp2dec } from 'urbit-ob';
import { acceptDm, cite, Content, declineDm, deSig } from '@urbit/api';
import { useContact } from '../../state/useContactState';
import useGraphState, { useDM } from '../../state/useGraphState';
import useHarkState, { useHarkDm } from '../../state/useHarkState';
import useSettingsState, { selectCalmState } from '../../state/useSettingsState';
import { initializePals } from '../../state/usePalsState';
import { GraphState } from '../../state/useGraphState';
import { useApi } from '../../hooks/useApi';
import { quoteReply } from '../../util/messages';
import { ChatPane } from '../../components/chat/ChatPane';
import { Col } from '../../components/spacing/Col';
import { Row } from '../../components/spacing/Row';
import { Text } from '../../components/Themed';
import { ActionButtonAsync } from '../../components/form/ActionButtonAsync';
import { useThemeWatcher } from '../../hooks/useThemeWatcher';
import { KeyboardAvoidingView, Platform } from 'react-native';

interface DmResourceProps {
  navigation: any;
  route: any;
}

const getCurrDmSize = (ship: string) => {
  const { graphs } = useGraphState.getState();
  const graph = graphs[`${global.ship}/dm-inbox`];
  if (!graph) {
    return 0;
  }
  const shipGraph = graph.get(bigInt(patp2dec(ship)));
  return shipGraph?.children?.size ?? 0;
};

export function DmResource({ navigation, route }: DmResourceProps) {
  const { ship } = route.params;
  const dm = useDM(ship);
  const hark = useHarkDm(ship);
  const unreadCount = hark.count;
  const contact = useContact(ship);
  const { hideNicknames } = useSettingsState(selectCalmState);
  const showNickname = !hideNicknames && Boolean(contact);
  const nickname = showNickname ? contact!.nickname : cite(ship) ?? ship;
  const pending = useGraphState(s => s.pendingDms.has(deSig(ship) || ''));
  const { api } = useApi();
  const { theme } = useThemeWatcher();

  useEffect(() => {
    if (api) {
      initializePals(api);
    }
  }, [api]);

  const [
    getYoungerSiblings,
    getOlderSiblings,
    getNewest,
    addDmMessage
  ] = useGraphState(
    (s: GraphState) => [
      s.getYoungerSiblings,
      s.getOlderSiblings,
      s.getNewest,
      s.addDmMessage
    ],
    shallow
  );

  useEffect(() => {
    if(dm.size === 0 && !pending) {
      getNewest(`~${global.ship}`, 'dm-inbox', 100, `/${patp2dec(ship)}`);
    }
  }, [ship, dm]);

  const fetchMessages = useCallback(
    async (newer: boolean) => {
      const pageSize = 100;
      const expectedSize = dm.size + pageSize;
      if (newer) {
        const index = dm.peekLargest()?.[0];
        if (!index) {
          return false;
        }
        await getYoungerSiblings(
          `~${global.ship}`,
          'dm-inbox',
          pageSize,
          `/${patp2dec(ship)}/${index.toString()}`
        );
        return expectedSize !== getCurrDmSize(ship);
      } else {
        const index = dm.peekSmallest()?.[0];
        if (!index) {
          return false;
        }
        await getOlderSiblings(
          `~${global.ship}`,
          'dm-inbox',
          pageSize,
          `/${patp2dec(ship)}/${index.toString()}`
        );
        return expectedSize !== getCurrDmSize(ship);
      }
    },
    [ship, dm]
  );

  const dismissUnread = useCallback(() => {
    const harkPath = `/graph/~${global.ship}/dm-inbox/${patp2dec(ship)}`;
    useHarkState.getState().readCount(harkPath);
  }, [ship]);

  const onSubmit = useCallback(
    (contents: Content[]) => {
      addDmMessage(ship, contents);
    },
    [ship, addDmMessage]
  );

  const onAccept = async () => {
    await api?.poke(acceptDm(ship));
  };
  const onDecline = async () => {
    navigation.navigate('Tabs', { screen: 'Messages' });
    await api?.poke(declineDm(ship));
  };

  // const onLike = useCallback(async ({ author, signatures, index }: Post) => {
  //   if (global.ship !== author) {
  //     const ship = global.ship;
  //     const name = 'dm-inbox';
  //     const remove = signatures.find(({ ship }) => ship === global.ship);

  //     const body = remove
  //       ? {
  //         'remove-signatures': {
  //           uid: { resource: { ship, name }, index },
  //           signatures: []
  //         }
  //       } // unlike
  //       : {
  //         'add-signatures': {
  //           uid: { resource: { ship, name }, index },
  //           signatures: []
  //         }
  //       }; // like

  //     // TODO: remove this check once the remove-signatures backend has been updated. Right now it removes all signatures, which is wrong
  //     if (!remove) {
  //       await api.thread({
  //         inputMark: 'graph-update-3',
  //         outputMark: 'json',
  //         threadName: `${remove ? 'remove' : 'add'}-signatures`,
  //         desk: 'escape',
  //         body
  //       });
  //     }
  //   }
  // }, []);

  return (
    <KeyboardAvoidingView behavior='padding' keyboardVerticalOffset={60} enabled={Platform.OS === 'ios'}>
      <Col style={{ width: '100%', height: '100%', backgroundColor: theme.colors.white }}>
        {pending ? (
          <Col style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Col style={{ marginVertical: 8 }}>
              <Text>{ship} has invited you to a DM</Text>
              <Row style={{ marginHorizontal: 4 }}>
                <ActionButtonAsync onPress={onAccept}>
                  Accept
                </ActionButtonAsync>
                <ActionButtonAsync onPress={onDecline} variant="destructive">
                  Decline
                </ActionButtonAsync>
              </Row>
            </Col>
          </Col>
        ) : (
          <ChatPane
            canWrite
            id={ship}
            graph={dm}
            unreadCount={unreadCount}
            onReply={quoteReply}
            fetchMessages={fetchMessages}
            dismissUnread={dismissUnread}
            getPermalink={() => ''}
            isAdmin={false}
            onSubmit={onSubmit}
          />
        )}
      </Col>
    </KeyboardAvoidingView>
  );
}
