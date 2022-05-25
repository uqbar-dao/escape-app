import { Associations, Graph, Unreads, Post} from '@urbit/api';
import { patp, patp2dec } from 'urbit-ob';
import _ from 'lodash';

import useMetadataState from '../state/useMetaDataState';
import { Workspace } from '../types/workspace';

export type SidebarSort = 'asc' | 'lastUpdated';

export function stripNonWord(string: string): string {
  return string.replace(/[^\p{L}\p{N}\p{Z}]/gu, '');
}

export function alphabeticalOrder(a: string, b: string) {
  return stripNonWord(a).toLowerCase().trim().localeCompare(stripNonWord(b).toLowerCase().trim());
}

export function getItems(associations: Associations, workspace: Workspace, inbox: Graph, pending: string[]) {
  const filtered = Object.keys(associations.graph).filter((a) => {
    const assoc = associations.graph[a];
    if (!('graph' in assoc.metadata.config)) {
      return false;
   } else if (workspace?.type === 'group') {
     const group = workspace.group;
     return group ? (
       assoc.group === group &&
       !assoc.metadata.hidden
     ) : (
       !(assoc.group in associations.groups) &&
       'graph' in assoc.metadata.config &&
       assoc.metadata.config.graph !== 'chat' &&
       !assoc.metadata.hidden
     );
   } else if (workspace?.type === 'messages') {
     return (
       !assoc.metadata.hidden &&
       !(assoc.group in associations.groups) &&
       assoc.metadata.config.graph === 'chat'
     );
   } else {
     return (
       !(assoc.group in associations.groups) &&
       assoc.metadata.config.graph !== 'chat'
     );
   }
  });
 const direct: string[] = workspace.type !== 'messages' ? []
   : inbox.keys().map(x => patp(x.toString()));
 const pend = workspace.type !== 'messages'
   ? []
   : pending;

 return _.union(direct, pend, filtered);
}

export function sidebarSort(unreads: Unreads, pending: string[]): Record<SidebarSort, (a: string, b: string) => number> {
  const { associations }: any = useMetadataState.getState();
  const alphabetical = (a: string, b: string) => {
    const aAssoc = associations[a];
    const bAssoc = associations[b];
    const aTitle = aAssoc?.metadata?.title || a;
    const bTitle = bAssoc?.metadata?.title || b;

    return alphabeticalOrder(aTitle, bTitle);
  };

  const lastUpdated = (a: string, b: string) => {
    const aPend = pending.includes(a);
    const bPend = pending.includes(b);
    if(aPend && !bPend) {
      return -1;
    }
    if(bPend && !aPend) {
      return 1;
    }
    const aUpdated = a.startsWith('~')
      ?  (unreads?.[`/graph/~${global.ship}/dm-inbox/${patp2dec(a)}`]?.last || 0)
      :  (unreads?.[`/graph/${a.slice(6)}`]?.last || 0);

    const bUpdated = b.startsWith('~')
      ?  (unreads?.[`/graph/~${global.ship}/dm-inbox/${patp2dec(b)}`]?.last || 0)
      :  (unreads?.[`/graph/${b.slice(6)}`]?.last || 0);

    return bUpdated - aUpdated || alphabetical(a, b);
  };

  return {
    asc: alphabetical,
    lastUpdated
  };
}

export const quoteReply = (post: Post) => {
  const reply = _.reduce(
    post.contents,
    (acc, content) => {
      if ('text' in content) {
        return `${acc}${content.text}`;
      } else if ('url' in content) {
        return `${acc}${content.url}`;
      } else if ('mention' in content) {
        return `${acc}${content.mention}`;
      }
      return acc;
    },
    ''
  )
    .split('\n')
    .map(l => `> ${l}`)
    .join('\n');
  return `${reply}\n\n`;
};
