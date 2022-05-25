import React, { ReactElement, useState } from 'react';
import _ from 'lodash';
import { Associations, Timebox } from '@urbit/api';

import useGraphState, { useInbox } from '../../state/useGraphState';
import useGroupState from '../../state/useGroupState';
import useHarkState from '../../state/useHarkState';
import useInviteState from '../../state/useInviteState';
import useMetadataState from '../../state/useMetaDataState';
import { getItems, sidebarSort } from '../../util/messages';
import { SidebarAssociationItem, SidebarDmItem, SidebarPendingItem } from './ListItem';
import useStore from '../../state/useStore';
import { Workspace } from '../../types/workspace';
import { RefreshControl, ScrollView } from 'react-native';

export const getHasNotification = (associations: Associations, group: string, unseen: Timebox) => {
  let hasNotification = false;
  for (const key in unseen) {
    const formattedKey = key.replace('landscape/graph', '/ship').replace('/mention', '');
    if (associations.graph[formattedKey]?.group === group) {
      hasNotification = true;
      break;
    }
  }
  return hasNotification;
};

export interface GroupsListProps {
  refresh: () => void;
  isMessages?: boolean;
}

export function GroupsList({
  refresh,
  isMessages = false
}: GroupsListProps): ReactElement {
  const groupSelected = false;
  const sortBy = 'lastUpdated';
  const workspace = { type: 'messages' } as Workspace;

  const [refreshing, setRefreshing] = useState(false);
  const { associations } = useMetadataState();
  const { groups } = useGroupState();
  const inbox = useInbox();
  const pendingDms = useGraphState((s: any) => [...s.pendingDms].map(s => `~${s}`));
  const pendingGroupChats = useGroupState((s: any) => _.pickBy(s.pendingJoin, (req, rid) => !(rid in groups) && req.app === 'graph'));
  const inviteGroupChats = useInviteState(
    (s: any) => Object.values(s.invites?.['graph'] || {})
    .map((inv: any) => `/ship/~${inv.resource.ship}/${inv.resource.name}`).filter(group => !(group in groups))
  );
  const pending = [...pendingDms, ...Object.keys(pendingGroupChats), ...inviteGroupChats];
  const { unreads, unseen } = useHarkState();

  const ordered = getItems(associations, workspace, inbox, pending)
    .sort(sidebarSort(unreads, pending)[sortBy]);

  const selected = '~emptyd-sihhip';

  return (
    <ScrollView refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={() => {
        setRefreshing(true);
        refresh();
        setTimeout(() => setRefreshing(false), 100);
      }} enabled />
    } style={{ zIndex: 0 }} contentContainerStyle={{ display: 'flex', alignItems: 'flex-start' }}>
      {ordered.map((pathOrShip: string, i: number, arr: string[]) => {
        const pathAsGraph = pathOrShip.replace('ship', 'graph');
        const { count, each } = unreads[pathAsGraph] || { count: 0, each: [] };
        const isDm = pathOrShip.startsWith('~');
        const isPending = pending.includes(pathOrShip);
        const channelSelected = pathOrShip === selected;

        return isDm ? (
            <SidebarDmItem
              key={pathOrShip}
              ship={pathOrShip}
              workspace={workspace}
              selected={channelSelected}
              pending={isPending}
              indent={0.5}
              first={i === 0}
              last={i === arr.length - 1}
            />
          ) : isPending ? (
            <SidebarPendingItem
              key={pathOrShip}
              path={pathOrShip}
              selected={channelSelected}
              indent={1}
            />
          ) : (
          <SidebarAssociationItem
            key={pathOrShip}
            selected={channelSelected}
            groupSelected={groupSelected}
            association={associations.graph[pathOrShip]}
            hideUnjoined={false}
            fontSize={14}
            workspace={workspace}
            unreadCount={count + each.length}
            hasNotification={Boolean(unseen?.[`landscape${pathAsGraph}/mention`])}
            indent={isMessages ? 0.5 : 1}
          />
          );
      })}
    </ScrollView>
  );
}
