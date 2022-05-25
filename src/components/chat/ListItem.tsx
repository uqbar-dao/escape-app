import _ from 'lodash';
import React, { ReactNode } from 'react';
import urbitOb from 'urbit-ob';
import { Association, cite, deSig } from '@urbit/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'react-native';
import { Workspace } from '../../types/workspace';
import useContactState, { useContact } from '../../state/useContactState';
import useSettingsState from '../../state/useSettingsState';
import { getItemTitle, uxToHex } from '../../util/landscape';
import useGraphState from '../../state/useGraphState';
import { usePreview } from '../../state/useMetaDataState';
import { IMAGE_NOT_FOUND } from '../../util/constants';
import { useHarkDm, useHarkStat } from '../../state/useHarkState';
import { Row } from '../spacing/Row';
import { Text, View } from '../Themed';
import useGroupState from '../../state/useGroupState';
import useStore from '../../state/useStore';
import { Link } from '../nav/Link';
import { useNav } from '../../hooks/useNav';
import { getCurrentPath } from '../../util/navigation';
import Sigil from '../Sigil';
import { useThemeWatcher } from '../../hooks/useThemeWatcher';

function useAssociationStatus(resource: string) {
  const [, , ship, name] = resource.split('/');
  const graphKey = `${deSig(ship)}/${name}`;
  const isSubscribed = useGraphState(s => s.graphKeys.has(graphKey));
  const stats = useHarkStat(`/graph/~${graphKey}`);
  const { count, each } = stats;
  const hasNotifications = false;
  const hasUnread = count > 0 || each.length > 0;
  if(!isSubscribed) {
    return 'unsubscribed';
  } else if (hasNotifications) {
    return 'notification';
  } else if (hasUnread) {
    return 'unread';
  } else {
    return undefined;
  }
}

export function SidebarItemBase(props: {
  to: string;
  selected?: boolean;
  groupSelected?: boolean;
  hasNotification?: boolean;
  hasUnread?: boolean;
  unreadCount?: number;
  isSynced?: boolean;
  children?: ReactNode;
  title: string;
  mono?: boolean;
  fontSize?: number;
  pending?: boolean;
  isGroup?: boolean;
  isFolder?: boolean;
  locked?: boolean;
  isAdmin?: boolean;
  isApps?: boolean;
  open?: boolean;
  indent?: number;
  first?: boolean;
  last?: boolean;
  onPress?: () => void;
}) {
  const {
    title,
    children = null,
    to,
    selected = false,
    groupSelected = false,
    fontSize = 14,
    hasNotification = false,
    hasUnread = false,
    unreadCount = 0,
    isSynced = false,
    mono = false,
    pending = false,
    isGroup = false,
    isFolder = false,
    locked = false,
    isAdmin = false,
    isApps = false,
    open = false,
    indent = 0,
    onPress = () => null,
    first = false,
    last = false,
  } = props;
  const { theme: { colors } } = useThemeWatcher();

  const color = isSynced
    ? selected || (!isGroup && hasUnread)
      ? colors.black
      : colors.gray
    : colors.lightGray;

  const hasGroupUnread = (isGroup || isFolder) && (hasUnread || hasNotification);
  const hasChannelUnread = !isGroup && !isFolder && (hasUnread || hasNotification);

  const fontStyle = hasGroupUnread ? 'italic' : 'normal';
  const fontWeight = hasChannelUnread ? '600' : 'normal';
  const backgroundColor = pending ? colors.washedBlue : groupSelected ? colors.lightGray : colors.white;
  const borderBottomWidth = selected ? 1 : undefined;
  const borderBottomColor = selected ? colors.lightGray : undefined;

  return (
    <Row
      style={{
        backgroundColor,
        width: '100%',
        justifyContent: 'space-between',
        zIndex: 1,
        paddingTop: first ? 12 : 4,
        paddingBottom: last ? 12 : 4,
        paddingLeft: indent * 28,
        paddingRight: 8,
      }}
    >
      <Row style={{ width: "100%", alignItems: "center", flex: 1, minWidth: 0, backgroundColor }}>
        {children}
        <Link to={to} title={title} onPress={onPress}>
          <Row style={{ width: "100%", flexShrink: 2, marginLeft: 8, display: "flex", overflow: "hidden", alignItems: "center", backgroundColor }}>
            <Text
              style={{
                lineHeight: 24,
                overflow: 'hidden',
                color,
                fontSize,
                fontWeight,
                fontStyle,
                borderBottomWidth,
                borderBottomColor,
                backgroundColor,
              }}
              mono={mono}
              numberOfLines={1}
            >
              {title}
            </Text>
            {title === 'Messages' && (
              <Link to='/~landscape/messages/new' style={{ zIndex: 2 }}>
                <View style={{ marginTop: 4, marginLeft: 16 }}>
                  <Ionicons name="add-outline" color="gray" style={{ paddingRight: 12 }} />
                </View>
              </Link>
            )}
            {hasNotification && <View style={{ backgroundColor: colors.blue, height: 6, width: 6, marginLeft: 4, borderRadius: 3 }} />}
            {hasUnread && (
              <View style={{ borderRadius: 12 }}>
                <Text
                  style={{
                    paddingVertical: 1,
                    paddingHorizontal: 3,
                    fontSize: 10,
                    color: colors.white,
                    backgroundColor: colors.gray,
                    textAlign: 'center',
                    marginHorizontal: 6,
                  }}
                >
                  {unreadCount}
                </Text>
              </View>
            )}
            {locked && (
              <Ionicons color="gray" name="lock-closed-outline" size={14} style={{ marginLeft: hasUnread ? 0 : 6, marginRight: 6 }} />
            )}
          </Row>
        </Link>
        {(isAdmin || isApps) && (
          <Link to={`${to}/new`}>
            <Row style={{ alignItems: 'center' }}>
              <Ionicons name="add-outline" color="gray" style={{ paddingLeft: 2 }} />
            </Row>
          </Link>
        )}
      </Row>
    </Row>
  );
}

export const SidebarPendingItem = (props: {
  path: string;
  selected: boolean;
  indent?: number;
}) => {
  const { path, selected } = props;
  const { preview } = usePreview(path);
  const color = `#${uxToHex(preview?.metadata?.color || '0x0')}`;
  const title = preview?.metadata?.title || path;
  const to = `/~landscape/messages/pending/${path.slice(6)}`;
  return (
    <SidebarItemBase
      to={to}
      title={title}
      selected={selected}
      hasNotification={false}
      hasUnread={false}
      pending
      indent={props.indent}
    >
      <View style={{ flexShrink: 0, height: 16, width: 16, borderRadius: 2, backgroundColor: color, }} />
    </SidebarItemBase>
  );
};

export const SidebarDmItem = React.memo(
  (props: {
    ship: string;
    first: boolean;
    last: boolean;
    selected?: boolean;
    workspace: Workspace;
    pending?: boolean;
    indent?: number;
  }) => {
    const { ship, selected = false, pending = false, first, last } = props;
    const contact = useContact(ship);
    const { hideAvatars, hideNicknames } = useSettingsState((s: any) => s.calm);
    const title =
      !hideNicknames && contact?.nickname
        ? contact?.nickname
        : cite(ship) ?? ship;
    const { count, each } = useHarkDm(ship);
    const unreads = count + each.length;
    const img =
      contact?.avatar && !hideAvatars ? (
        <Image
          source={{ uri: contact.avatar }}
          style={{ width: 20, height: 20, marginRight: 4, borderRadius: 2, marginTop: 4 }}
          onError={({ currentTarget }: any) => {
            currentTarget.onerror = null; // prevents looping
            currentTarget.src = IMAGE_NOT_FOUND;
          }}
        />
      ) : (
        <View style={{ width: 20, height: 20, marginRight: 4, borderRadius: 2, marginTop: 4 }}>
          <Sigil
            ship={ship}
            color={`#${uxToHex(contact?.color || '0x0')}`}
            icon
            padding={2}
            size={20}
          />
        </View>
      );

    return (
      <SidebarItemBase
        selected={selected}
        hasNotification={unreads > 0}
        hasUnread={unreads > 0}
        to={`/~landscape/messages/dm/${ship}`}
        title={title}
        mono={hideAvatars || !contact?.nickname}
        isSynced
        pending={pending}
        unreadCount={unreads}
        indent={props.indent}
        first={first}
        last={last}
      >
        {img}
      </SidebarItemBase>
    );
  }
);
// eslint-disable-next-line max-lines-per-function
export const SidebarAssociationItem = React.memo(
  (props: {
    hideUnjoined: boolean;
    association: Association;
    selected: boolean;
    workspace: Workspace;
    groupSelected?: boolean;
    fontSize?: number;
    unreadCount?: number;
    hasNotification?: boolean;
    indent?: number;
  }) => {
    const { ship, ships } = useStore();
    const { theme: { colors } } = useThemeWatcher();
    const currentPath = getCurrentPath(ship, ships);
    const { navigate } = useNav();
    const { association, selected } = props;
    const title = association ? getItemTitle(association) || "" : "";
    const appName = association?.["app-name"];
    let mod: string = appName;
    if (
      association?.metadata?.config &&
      "graph" in association.metadata.config
    ) {
      mod = association.metadata.config.graph;
    }
    const pending = useGroupState(s => association.group in s.pendingJoin);
    const rid = association?.resource;
    const { hideNicknames } = useSettingsState((s) => s.calm);
    const contacts = useContactState((s) => s.contacts);
    const group = useGroupState(s => association ? s.groups[association.group] : undefined);
    const isUnmanaged = group?.hidden || false;
    const DM = isUnmanaged && props.workspace?.type === "messages";
    const itemStatus = useAssociationStatus(rid);
    const hasUnread = itemStatus === "unread";
    const isSynced = itemStatus !== "unsubscribed";
    let baseUrl = `/~landscape${association.group}`;

    if (DM) {
      baseUrl = "/~landscape/messages";
    } else if (isUnmanaged) {
      baseUrl = "/~landscape/home";
    }

    const to = isSynced
      ? `${baseUrl}/resource/${mod}${rid}`
      : `${baseUrl}/join/${mod}${rid}`;

    const onPress = pending ? () => {
      useGroupState.getState().doneJoin(rid);
    } : () => {
      if (group && !currentPath.includes(baseUrl)) {
        navigate(baseUrl);
      }
    };

    if (props.hideUnjoined && !isSynced) {
      return null;
    }

    const participantNames = (str: string): string => {
      if (_.includes(str, ',') && _.startsWith(str, '~')) {
        const names = _.split(str, ', ');
        return names.map((name, idx) => {
          if (urbitOb.isValidPatp(name)) {
            if (contacts[name]?.nickname && !hideNicknames)
              return (`${contacts[name]?.nickname}`);
            return name;
          } else {
            return name;
          }
        }).join(', ');
      } else {
        return str;
      }
    };

    return (
      <SidebarItemBase
        to={to}
        selected={selected}
        groupSelected={props.groupSelected}
        hasUnread={hasUnread}
        fontSize={props.fontSize}
        isSynced={isSynced}
        mono
        title={
          DM && !urbitOb.isValidPatp(title) ? participantNames(title) : title
        }
        hasNotification={props.hasNotification}
        pending={pending}
        onPress={onPress}
        unreadCount={props.unreadCount}
        indent={props.indent}
      >
        {DM ? (
          <View style={{
            flexShrink: 0,
            height: 20,
            width: 20,
            borderRadius: 2,
            backgroundColor: `#${uxToHex(props?.association?.metadata?.color)}` || '#000000',
            marginRight: 4,
            marginTop: 4,
          }}
          />
        ) : (
          <Ionicons
            color={isSynced ? colors.black : colors.lightGray}
            name="people-outline"
          />
        )}
      </SidebarItemBase>
    );
  }
);
