import Urbit from '../api';
import React, { useCallback, useEffect, useState } from 'react';
import useHarkState from '../state/useHarkState';
import useMetadataState from '../state/useMetaDataState';
import useLocalState from '../state/useLocalState';
import gcpManager from '../state/gcpManager';
import useGroupState from '../state/useGroupState';
import useContactState from '../state/useContactState';
import useSettingsState from '../state/useSettingsState';
import useInviteState from '../state/useInviteState';
import useGraphState from '../state/useGraphState';
import useStore from '../state/useStore';
import { deSig } from '@urbit/api';
// import useLaunchState from '../state/launch';
// import useStorageState from '../state/storage';

export const RESOURCE_REGEX = /\/resource\/[a-z]*?\/ship\//;

export const configureApi = (ship: string, shipUrl: string) => {
  const api = new Urbit(shipUrl, '', 'landscape', deSig(ship));
  window.desk = 'landscape';
  global.api = api;

  api.onError = (e: any) => {
    (async () => {
      const { reconnect, errorCount, set } = useLocalState(deSig(ship) || '').getState();
      if(errorCount > 1) {
        set((s: any) => {
          s.subscription = 'disconnected';
        });
        return;
      }
      try {
        await reconnect();
      } catch (e) {
      }
    })();
  };

  api.onRetry = () => {
    useLocalState(ship).setState({ subscription: 'reconnecting' });
  };

  api.onOpen = () => {
    useLocalState(ship).setState({ subscription: 'connected' });
  };

  return api;
}

export const useApi = () => {
  const { ship, api } = useStore();

  const bootstrap = useCallback(async (reset = false) => {
    if (api) {
      if (reset) {
        api.reset();
      }
    
      const subs = [
        useMetadataState,
        useContactState,
        useGraphState,
        useGroupState,
        useHarkState,
        useInviteState,
        useSettingsState,
        // useStorageState,
        // useLaunchState,
      ].map(state => state.getState().initialize(api));
    
      try {
        await Promise.all(subs);
        useSettingsState.getState().getAll();
        // gcpManager.start();
        
        const {
          getKeys,
          getShallowChildren
        } = useGraphState.getState();
        
        useHarkState.getState().getUnreads();
        // getKeys();
        getShallowChildren(ship, 'dm-inbox');
      } catch (err) {
      }
    }
  }, [api, ship]);

  return { api, bootstrap }
}
