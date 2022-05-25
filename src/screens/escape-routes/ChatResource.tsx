import { Association, Content, createPost, deSig, fetchIsAllowed, isWriter, Post, removePosts, resourceFromPath } from '@urbit/api';
import { BigInteger } from 'big-integer';
import _ from 'lodash';
import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';
import shallow from 'zustand/shallow';
import { disallowedShipsForOurContact } from '../../state/useContactState';
import { getPermalinkForGraph } from '../../util/permalinks';
import { toHarkPath } from '../../util/landscape';
import useGraphState, { useGraphForAssoc } from '../../state/useGraphState';
import { useGroupForAssoc } from '../../state/useGroupState';
import useHarkState, { useHarkStat } from '../../state/useHarkState';
import useMetadataState from '../../state/useMetaDataState';
import useBookmarks from '../../hooks/useBookmarks';
import { ChatPane } from '../../components/chat/ChatPane';
import { useApi } from '../../hooks/useApi';
import useStore from '../../state/useStore';
import { ActivityIndicator, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const getCurrGraphSize = (ship: string, name: string) => {
  const { graphs } = useGraphState.getState();
  const graph = graphs[`${ship}/${name}`];
  return graph?.size ?? 0;
};

export interface LinkCollection {
  path: string;
  title: string;
}

type ChatResourceProps = {
  route: any;
};

const ChatResource = ({
  route,
}: ChatResourceProps): ReactElement => {
  // const { association } = props;
  const { path } = route.params;
  const { associations } = useMetadataState();
  const association = associations.graph['/' + path.split('/').slice(-3).join('/')];

  // const navigation = useNavigation();

  // if (!association) {
  //   navigation.goBack();
  // }

  const { resource } = association;
  const [toShare, setToShare] = useState<string[] | string | undefined>();
  const group = useGroupForAssoc(association)!;
  const graph = useGraphForAssoc(association);
  const stats = useHarkStat(toHarkPath(association.resource));
  const { onBookmark } = useBookmarks();
  const { api } = useApi();
  const unreadCount = stats.count;
  const canWrite = group ? isWriter(group, resource, global.ship) : false;
  const [
    getNewest,
    getNode,
    getOlderSiblings,
    getYoungerSiblings,
    addPost
  ] = useGraphState(
    s => [s.getNewest, s.getNode, s.getOlderSiblings, s.getYoungerSiblings, s.addPost],
    shallow
  );

  useEffect(() => {
    const { ship, name } = resourceFromPath(resource);

    const [, search] = path.split('?');
    const searchMsg = search?.split('&')?.find((s: string) => s.slice(0,3) === 'msg');

    const scrollTo = searchMsg ? Number(searchMsg.split('=').slice(-1)[0]) : undefined;

    const count = scrollTo ? 50 : Math.min(400, 100 + unreadCount);

    if (scrollTo) {
      getNode(ship, name, `/${scrollTo}`);
      getYoungerSiblings(ship, name, count, `/${scrollTo}`);
      getOlderSiblings(ship, name, count, `/${scrollTo}`);
    } else {
      getNewest(ship, name, count);
    }

    setToShare(undefined);
    (async function () {
      if (group.hidden) {
        if (api) {
          const members = await disallowedShipsForOurContact(
            Array.from(group.members),
            api
          );
          if (members.length > 0) {
            setToShare(members);
          }
        }
      } else {
        const { ship: groupHost } = resourceFromPath(association.group);
        const shared = await api?.scry(fetchIsAllowed(
          `~${global.ship}`,
          'personal',
          groupHost,
          true
        ));
        if (!shared) {
          setToShare(association.group);
        }
      }
    })();
  }, [resource]);

  const onReply = useCallback(
    (msg: Post) => {
      const url = getPermalinkForGraph(
        association.group,
        association.resource,
        msg.index
      );
      return `${url}\n~${msg.author}: `;
    },
    [association.resource]
  );

  const isAdmin = useMemo(
    () => (group ? _.includes(group.tags.role.admin, deSig(window.ship)) : false),
    [group]
  );

  const collections = useMemo(() => !isAdmin ? [] : Object.keys(associations.graph).filter((channel) => {
    const assoc = associations.graph[channel];
    return assoc.group === association.group && assoc.metadata.config.graph === 'link';
  }).map(path => ({
    title: associations.graph[path].metadata.title,
    path
  })), [associations, association, isAdmin]);

  const getMostRecent = useCallback(() => {
    const { ship, name } = resourceFromPath(resource);
    const count = Math.min(400, 100 + unreadCount);
    getNewest(ship, name, count);
  }, [resource, unreadCount]);

  const fetchMessages = useCallback(async (newer: boolean) => {
    const pageSize = 100;

    const [, , ship, name] = resource.split('/');
    const graphSize = graph?.size ?? 0;
    const expectedSize = graphSize + pageSize;
    if(graphSize === 0) {
      // already loading the graph
      return false;
    }
    if (newer) {
      const index = graph.peekLargest()?.[0];
      if (!index) {
        return false;
      }
      await getYoungerSiblings(
        ship,
        name,
        pageSize,
        `/${index.toString()}`
      );
      return expectedSize !== getCurrGraphSize(deSig(ship) || '', name);
    } else {
      const index = graph.peekSmallest()?.[0];
      if (!index) {
        return false;
      }
      await getOlderSiblings(ship, name, pageSize, `/${index.toString()}`);
      const currSize = getCurrGraphSize(deSig(ship) || '', name);
      const done = expectedSize !== currSize;
      return done;
    }
  }, [graph, resource]);

  const onSubmit = useCallback((contents: Content[]) => {
    const { ship, name } = resourceFromPath(resource);
    addPost(ship, name, createPost(global.ship, contents));
  }, [resource, addPost, createPost]);

  const onDelete = useCallback((msg: Post) => {
    const { ship, name } = resourceFromPath(resource);
    api?.poke(removePosts(ship, name, [msg.index]));
  }, [resource]);

  const onLike = useCallback(async ({ author, signatures, index }: Post) => {
    if (global.ship !== author) {
      const { ship, name } = resourceFromPath(resource);
      const remove = signatures.find(({ ship }: any) => ship === global.ship);

      const body = remove
        ? {
          'remove-signatures': {
            uid: { resource: { ship, name }, index },
            signatures: []
          }
        } // unlike
        : {
          'add-signatures': {
            uid: { resource: { ship, name }, index },
            signatures: []
          }
        }; // like

      // TODO: remove this check once the remove-signatures backend has been updated. Right now it removes all signatures, which is wrong
      if (!remove) {
        await api?.thread({
          inputMark: 'graph-update-3',
          outputMark: 'json',
          threadName: `${remove ? 'remove' : 'add'}-signatures`,
          desk: 'escape',
          body
        });
      }
    }
  }, [resource]);

  const dismissUnread = useCallback(() => {
    useHarkState.getState().readCount(toHarkPath(association.resource));
  }, [association.resource]);

  const getPermalink = useCallback(
    (index: BigInteger) =>
      getPermalinkForGraph(association.group, resource, `/${index.toString()}`),
    [association.resource]
  );

  if (!graph) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <KeyboardAvoidingView behavior='padding' keyboardVerticalOffset={60} enabled={Platform.OS === 'ios'}>
      <ChatPane
        id={resource.slice(7)}
        promptShare={toShare}
        {...{
          graph,
          unreadCount,
          canWrite,
          onReply,
          onDelete,
          onLike,
          onSubmit,
          onBookmark,
          fetchMessages,
          dismissUnread,
          getPermalink,
          isAdmin,
          group,
          association,
          collections,
          getMostRecent
        }}
      />
    </KeyboardAvoidingView>
  );
};

export { ChatResource };
