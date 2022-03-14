import create from "zustand";
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
}

const getNewStore = (store: Store, targetShip: string, shipConnection: ShipConnection) => {
  const { ship, shipUrl, authCookie, ships } = store;
  const shipSet = Boolean(ship && shipUrl && authCookie);

  return {
    ships: [...ships.filter((s) => s.ship !== targetShip), shipConnection],
    ship: shipSet ? ship : shipConnection.ship,
    shipUrl: (shipSet ? shipUrl : shipConnection.shipUrl).toLowerCase(),
    authCookie: shipSet ? authCookie : shipConnection.authCookie,
  };
}

const useStore = create<Store>((set) => ({
  loading: true,
  escapeInstalled: true,
  needLogin: true,
  ship: '',
  shipUrl: '',
  authCookie: '',
  ships: [],
  setNeedLogin: (needLogin: boolean) => set(() => ({ needLogin })),
  loadStore: (store: any) => set(() => store),
  setShipUrl: (shipUrl: string) => set({ shipUrl }),
  setLoading: (loading: boolean) => set({ loading }),
  setEscapeInstalled: (escapeInstalled: boolean) =>set({ escapeInstalled }),
  setPath: (targetShip: string, path: string) => set((store) => {
    const shipConnection = store.ships.find((s) => s.ship === targetShip);
    if (shipConnection) {
      shipConnection.path = path;
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
    const newStore: any = getNewStore(store, shipConnection.ship, { ...shipConnection, ship: `~${deSig(ship)}` });
    
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
    const newShip = ships.find(({ ship }) => ship === selectedShip);
    const newStore = { ships, ship: '', shipUrl: '', authCookie: '' };
    if (newShip) {
      newStore.ship = newShip.ship;
      newStore.shipUrl = newShip.shipUrl;
      newStore.authCookie = newShip.authCookie || '';
    }

    storage.save({ key: 'store', data: newStore });
    return newStore;
  }),
  clearShip: () => set(() => ({ ship: '', shipUrl: '', authCookie: '' })),
}));

export default useStore;
