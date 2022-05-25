import _ from 'lodash';
import { reduce } from './reducers/s3-update';
import { createState, createSubscription, reduceStateN } from './base';

export interface GcpToken {
  accessKey: string;
  expiresIn: number;
}

export interface StorageState {
  gcp: {
    configured?: boolean;
    token?: GcpToken;
    isConfigured: () => Promise<boolean>;
    getToken: () => Promise<void>;
  };
  s3: {
    configuration: {
      buckets: Set<string>;
      currentBucket: string;
    };
    credentials: any | null; // TODO better type
  };
}

// @ts-ignore investigate zustand types
const useStorageState = createState<StorageState>(
  'Storage',
  (set, get) => ({
    gcp: {
      isConfigured: () => {
        return global.api.thread({
          inputMark: 'noun',
          outputMark: 'json',
          threadName: 'gcp-is-configured',
          body: {}
        });
      },
      getToken: async () => {
        const token = await global.api.thread<GcpToken>({
          inputMark: 'noun',
          outputMark: 'gcp-token',
          threadName: 'gcp-get-token',
          body: {}
        });
        get().set((state) => {
          state.gcp.token = token;
        });
      }
    },
    s3: {
      configuration: {
        buckets: new Set(),
        currentBucket: ''
      },
      credentials: null
    }
  }),
  ['s3', 'gcp'],
  [
    (set, get) =>
      createSubscription('s3-store', '/all', (e) => {
        const d = _.get(e, 's3-update', false);
        if (d) {
          reduceStateN(get(), d, reduce);
        }
      })
  ]
);

export default useStorageState;
