import { Association, Associations, MetadataUpdatePreview } from '@urbit/api';
import _ from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import {
  createState,
  createSubscription,
  reduceStateN
} from './base';
import { reduce } from './reducers/metadata-update';

export const METADATA_MAX_PREVIEW_WAIT = 150000;

export interface MetadataState {
  associations: Associations;
  loaded: boolean;
  getPreview: (group: string) => Promise<MetadataUpdatePreview
  >;
  previews: {
    [group: string]: MetadataUpdatePreview
  }
}

// @ts-ignore investigate zustand types
const useMetadataState = createState<MetadataState>(
  'Metadata',
  (set, get) => ({
    loaded: false,
    associations: {
      groups: {},
      graph: {}
    },
    previews: {},
    getPreview: async (group: string): Promise<MetadataUpdatePreview> => {
      const state = get();
      if(group in state.previews) {
        return state.previews[group];
      }
      try {
        const preview = await global.api.subscribeOnce('metadata-pull-hook', `/preview${group}`, 20 * 1000);
        if('metadata-hook-update' in preview) {
          const newState = get();
          newState.set((s) => {
            s.previews[group] = preview['metadata-hook-update'].preview;
          });
          return preview['metadata-hook-update'].preview;
        } else {
          throw 'no-permissions';
        }
      } catch (e) {
        if(e === 'timeout') {
          throw 'offline';
        }
        throw e;
      }
    }
  }),
  ['loaded'],
  [
    (set, get) =>
      createSubscription('metadata-store', '/all', (j) => {
        console.log('sub 0')
        const d = _.get(j, 'metadata-update', false);
        console.log('sub 1')
        if (d) {
          console.log('sub 2')
          reduceStateN(get(), d, reduce);
        }
      })
  ]
);

export function useAssocForGraph(graph: string) {
  return useMetadataState(
    useCallback(s => s.associations.graph[graph] as Association | undefined, [
      graph
    ])
  );
}

export function useAssocForGroup(group: string) {
  return useMetadataState(
    useCallback(
      s => s.associations.groups[group] as Association | undefined,
      [group]
    )
  );
}

const selPreview = (s: MetadataState) => [s.previews, s.getPreview] as const;

export function usePreview(group: string) {
  const [error, setError] = useState(null);
  const [previews, getPreview] = useMetadataState(selPreview);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await getPreview(group);
      } catch (e) {
        if(mounted) {
          setError(e as any);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [group]);

  const preview = previews[group];

  return { error, preview };
}

export function useGraphsForGroup(group: string) {
  const graphs = useMetadataState(s => s.associations.graph);
  return _.pickBy(graphs, (a: Association) => a.group === group);
}

export default useMetadataState;
