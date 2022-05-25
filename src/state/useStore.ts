import React from "react";
import WebView from "react-native-webview";
import create from "zustand";
import Urbit from "../api";
import { APP_URL_REGEX } from "../constants/Webview";
import { configureApi } from "../hooks/useApi";
import storage from "../util/storage";
import { deSig } from "../util/string";

export interface ShipConnection {
  ship: string;
  shipUrl: string;
  path: string;
  currentPath?: string;
  authCookie?: string;
}

interface Store {
  loading: boolean;
  escapeInstalled: boolean;
  needLogin: boolean;
  ship: string;
  shipUrl: string;
  authCookie: string;
  ships: ShipConnection[];
  api: Urbit | null;
  webViewRef: React.RefObject<WebView> | null;
  setNeedLogin: (needLogin: boolean) => void;
  loadStore: (store: any) => void;
  setShipUrl: (shipUrl: string) => void;
  setLoading: (loading: boolean) => void;
  setEscapeInstalled: (escapeInstalled: boolean) => void;
  setPath: (targetShip: string, path: string) => void;
  setCurrentPath: (targetShip: string, path: string) => void;
  addShip: (ship: ShipConnection) => void;
  removeShip: (ship: string) => void;
  removeAllShips: () => void;
  setShip: (ship: string) => void;
  clearShip: () => void;
  getCurrentPath: () => string;
  setWebViewRef: (webViewRef: React.RefObject<WebView>) => void;
}

const getNewStore = (store: Store, targetShip: string, shipConnection: ShipConnection, api?: Urbit) => {
  const { ship, shipUrl, authCookie, ships } = store;
  const shipSet = Boolean(ship && shipUrl && authCookie);

  return {
    api: api || store.api,
    ships: [...ships.filter((s) => s.ship !== targetShip), shipConnection],
    ship: shipSet ? ship : shipConnection.ship,
    shipUrl: (shipSet ? shipUrl : shipConnection.shipUrl).toLowerCase(),
    authCookie: shipSet ? authCookie : shipConnection.authCookie,
  };
}

const useStore = create<Store>((set, get) => ({
  loading: true,
  escapeInstalled: true,
  needLogin: true,
  ship: '',
  shipUrl: '',
  authCookie: '',
  ships: [],
  api: null,
  webViewRef: null,
  setNeedLogin: (needLogin: boolean) => set(() => ({ needLogin })),
  loadStore: (store: any) => set(() => {
    window.ship = deSig(store.ship);
    if (!global.window) {
      global.window = global;
    }
    global.window.ship = deSig(store.ship);

    const api = configureApi(store.ship, store.shipUrl);

    return {
      ...store,
      api,
      ships: store.ships.map((s: ShipConnection) => ({
        ...s,
        currentPath: '/apps/escape/',
        path: '/apps/escape/'
      }))
    };
  }),
  setShipUrl: (shipUrl: string) => set({ shipUrl }),
  setLoading: (loading: boolean) => set({ loading }),
  setEscapeInstalled: (escapeInstalled: boolean) =>set({ escapeInstalled }),
  setPath: (targetShip: string, path: string) => set((store) => {
    const shipConnection = store.ships.find((s) => s.ship === targetShip);
    if (shipConnection) {
      shipConnection.path = path;
      shipConnection.currentPath = path;
    }
    
    const newStore: any = getNewStore(store, targetShip, shipConnection!);

    storage.save({ key: 'store', data: newStore });
    return newStore;
  }),
  setCurrentPath: (targetShip: string, currentPath: string) => set((store) => {
    const shipConnection = store.ships.find((s) => s.ship === targetShip);
    if (shipConnection) {
      shipConnection.currentPath = currentPath;
    }
    
    const newStore: any = getNewStore(store, targetShip, shipConnection!);

    storage.save({ key: 'store', data: newStore });
    return newStore;
  }),
  addShip: (shipConnection: ShipConnection) => set((store) => {
    const { ship } = shipConnection;
    const api = configureApi(shipConnection.ship, shipConnection.shipUrl);
    const newStore: any = getNewStore(store, shipConnection.ship, { ...shipConnection, ship: `~${deSig(ship)}` }, api);
    
    storage.save({ key: 'store', data: newStore });
    return newStore;
  }),
  removeShip: (oldShip: string) => set(({ ships }) => {
    const newShips = ships.filter(({ ship }) => ship !== oldShip)
    const firstShip = newShips[0];
    
    const newStore = {
      ships: newShips,
      ship: '',
      shipUrl: '',
      authCookie: '',
      ...(firstShip ? firstShip : {})
    };

    storage.save({ key: 'store', data: newStore });

    return newStore;
  }),
  removeAllShips: () => set(() => {
    const newStore = { ships: [], ship: '', shipUrl: '', authCookie: '' };
    storage.save({ key: 'store', data: newStore });

    return newStore;
  }),
  setShip: (selectedShip: string) => set(({ ships }) => {
    window.ship = deSig(selectedShip);
    global.window.ship = deSig(selectedShip);
    const newShip = ships.find(({ ship }) => ship === selectedShip);
    const newStore: any = { ships, ship: '', shipUrl: '', authCookie: '', api: null };

    if (newShip) {
      const api = configureApi(newShip.ship, newShip.shipUrl);
      newStore.ship = newShip.ship;
      newStore.shipUrl = newShip.shipUrl;
      newStore.authCookie = newShip.authCookie || '';
      newStore.api = api;
    }

    storage.save({ key: 'store', data: newStore });
    return newStore;
  }),
  clearShip: () => set(() => ({ ship: '', shipUrl: '', authCookie: '' })),
  getCurrentPath: () => get().ships.find(({ ship }) => get().ship === ship)?.currentPath || '',
  setWebViewRef: (webViewRef: React.RefObject<WebView>) => set({ webViewRef }),
}));

export default useStore;
