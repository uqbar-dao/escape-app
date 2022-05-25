import produce from 'immer';
import f from 'lodash/fp';
import create, { State } from 'zustand';
import { persist } from 'zustand/middleware';
import { BackgroundConfig, LeapCategories, RemoteContentPolicy } from '../types/local-update';
import { clearStorageMigration, createStorageKey, storageVersion, wait } from '../util/landscape';

export type SubscriptionStatus = 'connected' | 'disconnected' | 'reconnecting';

export interface LocalState {
  browserId: string;
  theme: 'light' | 'dark' | 'auto';
  hideAvatars: boolean;
  hideNicknames: boolean;
  remoteContentPolicy: RemoteContentPolicy;
  hideGroups: boolean;
  hideUtilities: boolean;
  hideLeapCats: LeapCategories[];
  dark: boolean;
  mobile: boolean;
  breaks: {
    sm: boolean;
    md: boolean;
    lg: boolean;
  }
  background: BackgroundConfig;
  omniboxShown: boolean;
  suspendedFocus?: HTMLElement;
  toggleOmnibox: () => void;
  set: (fn: (state: LocalState) => void) => void;
  subscription: SubscriptionStatus;
  reconnect: () => Promise<void>;
  bootstrap: () => Promise<void>;
  errorCount: number;
}

type LocalStateZus = LocalState & State;

export const selectLocalState =
  <K extends keyof LocalState>(keys: K[]) => f.pick<LocalState, K>(keys);

const useLocalState = (ship: string) => create<LocalStateZus>(persist((set, get) => ({
  browserId: '',
  dark: false,
  mobile: false,
  breaks: {
    sm: false,
    md: false,
    lg: false
  },
  background: undefined,
  theme: 'auto',
  hideAvatars: false,
  hideNicknames: false,
  hideLeapCats: [],
  hideGroups: false,
  hideUtilities: false,
  remoteContentPolicy: {
    imageShown: true,
    audioShown: true,
    videoShown: true,
    oembedShown: true
  },
  omniboxShown: false,
  suspendedFocus: undefined,
  toggleOmnibox: () => set(produce((state) => {
    state.omniboxShown = !state.omniboxShown;
    if (typeof state.suspendedFocus?.focus === 'function') {
      state.suspendedFocus.focus();
      state.suspendedFocus = undefined;
    } else {
      state.suspendedFocus.blur();
    }
  })),
  subscription: 'connected',
  errorCount: 0,
  // XX this logic should be handled by eventsource lib, but channel$a
  // resume doesn't work properly
  reconnect: async () => {
    const { errorCount } = get();
    if(errorCount > 1) {
      return;
    }
    set(s => ({ subscription: 'reconnecting', errorCount: s.errorCount + 1 }));
    console.log(get().errorCount);

    try {
      // await bootstrapApi();
    } catch (e) {
      console.error(e);
      set({ subscription: 'disconnected' });
    }
  },
  bootstrap: async () => {
    set({ subscription: 'reconnecting', errorCount: 0 });
    global.api.reset();
    // await bootstrapApi();
    set({ subscription: 'connected' });
  },
  // @ts-ignore investigate zustand types
  set: fn => set(produce(fn))
  }), {
  partialize: (state) => {
    const blacklist: (keyof LocalState)[]  = [
      'suspendedFocus', 'toggleOmnibox', 'omniboxShown',
      'subscription', 'errorCount', 'breaks'
    ];
    blacklist.forEach((key) => delete state[key]);
    return state;
  },
  name: createStorageKey('local', ship),
  version: storageVersion,
  migrate: clearStorageMigration
}));

// export function withLocalState<P, S extends keyof LocalState, C extends React.ComponentType<P>>(Component: C, stateMemberKeys?: S[]) {
//   return React.forwardRef<C, Omit<P, S>>((props, ref) => {
//     const localState = stateMemberKeys ? useLocalState(
//       state => stateMemberKeys.reduce(
//         (object, key) => ({ ...object, [key]: state[key] }), {}
//       )
//     ): useLocalState();
//     // @ts-ignore call signature forwarding unclear
//     return <Component ref={ref} {...localState} {...props} />;
//   });
// }

const selOsDark = (s: LocalState) => s.dark;
export function useOsDark() {
  return useLocalState(global.ship)(selOsDark);
}

const selBrowserId = (s: LocalState) => s.browserId;
export function useBrowserId() {
  return useLocalState(global.ship)(selBrowserId);
}

export { useLocalState as default };
