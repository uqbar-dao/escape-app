import { useCallback, useEffect, useState } from 'react';
import { createPost, Post, removePosts, deSig, createUnmanagedGraph } from '@urbit/api';
import shallow from 'zustand/shallow';
import { useApi } from './useApi';
import useMetadataState from '../state/useMetaDataState';
import useSettingsState from '../state/useSettingsState';
import useGraphState from '../state/useGraphState';
import useGroupState from '../state/useGroupState';
import { BOOKMARK_DIVIDER } from '../util/constants';
import { useWaitForProps } from './useWaitForProps';
import { LinkCollection } from '../screens/escape-routes/ChatResource';
import { parsePermalink, permalinkToReference } from '../util/permalinks';
import { stringToSymbol } from '../util/landscape';

export default function useBookmarks() {
  const { groups } = useGroupState();
  const waiter = useWaitForProps({ groups }, 5000);
  const [addPost, graphs] = useGraphState(s => [s.addPost, s.graphs], shallow);
  const { putEntry, bookmarks } = useSettingsState.getState();
  const { associations } = useMetadataState();
  const { api } = useApi();

  const [pendingBookmark, setPendingBookmark] = useState<{ link?: string; ship?: string; path?: string }>({});

  useEffect(() => {
    const { link, ship, path } = pendingBookmark;
    if (link && ship && path && graphs[`${ship}/${path}`]) {
      const [, node] = graphs[`${ship}/${path}`].peekLargest();
      putEntry('bookmarks', link, `${path}${BOOKMARK_DIVIDER}${node.post.index}`);
      setPendingBookmark({});
    }
  }, [graphs, pendingBookmark]);

  const onBookmark = useCallback(async (msg: Post, permalink: string, collection: LinkCollection, add: boolean) => {
    const existingBookmark = bookmarks[permalink];
    if (add && !existingBookmark) {
      let path = collection.path;
      const isMyBookmarks = collection.title === 'My Bookmarks';

      if (isMyBookmarks && !associations.graph[collection.path]) {
        const name = 'My Bookmarks';
        const resId = `${stringToSymbol(name)}-${Math.floor(Math.random() * 10000)}`;

        try {
          const description = '';
          const moduleType = 'link';
          await api.thread(createUnmanagedGraph(
            global.ship,
            resId,
            name,
            description,
            { invite: { pending: [] } },
            moduleType
          ));

          await waiter(p => Boolean(p.groups?.[`/ship/~${global.ship}/${resId}`]));
          path = `/ship/~${global.ship}/${resId}`;
        } catch (e) {
          console.error(e);
        }
      }
      const [,, collectionShip, collectionName] = path.split('/');
      const url = permalink;
      const text = url; // maybe add an option to customize the title, or use some other default?
      const contents = url.startsWith('web+urbitgraph:/')
        ?  [{ text }, permalinkToReference(parsePermalink(url)!)]
        :  [{ text }, { url }];

      const parentIndex = ''; // this is always empty elsewhere
      const post = createPost(global.ship, contents, parentIndex);
      await addPost(`~${global.ship}`, collectionName, post);
      setPendingBookmark({ link: permalink, ship: deSig(collectionShip), path: collectionName });
    } else if (!add && existingBookmark) {
      const [collectionName, index] = existingBookmark.split(BOOKMARK_DIVIDER);
      api.poke(removePosts(`~${global.ship}`, collectionName, [index]));
      putEntry('bookmarks', permalink, '');
    }
  }, [associations, groups, waiter, graphs]);

  return {
    onBookmark
  };
}
