import create from "zustand";
import storage from "../util/storage";

export interface ShipConnection {
  ship: string;
  shipUrl: string;
  authCookie?: string;
}

interface Store {
  loading: boolean;
  needLogin: boolean;
  ship: string;
  shipUrl: string;
  authCookie: string;
  ships: ShipConnection[];
  setNeedLogin: (needLogin: boolean) => void;
  loadStore: (store: any) => void;
  setShipUrl: (shipUrl: string) => void;
  setLoading: (loading: boolean) => void;
  addShip: (ship: ShipConnection) => void;
  removeShip: (ship: string) => void;
  removeAllShips: () => void;
  setShip: (ship: string) => void;
  clearShip: () => void;
}

const useStore = create<Store>((set) => ({
  loading: true,
  needLogin: true,
  ship: '',
  shipUrl: '',
  authCookie: '',
  ships: [],
  setNeedLogin: (needLogin: boolean) => set(() => ({ needLogin })),
  loadStore: (store: any) => set(() => store),
  setShipUrl: (shipUrl: string) => set({ shipUrl }),
  setLoading: (loading: boolean) => set({ loading }),
  addShip: (newShip: ShipConnection) => set(({ ships, ship, authCookie, shipUrl }) => {
    const shipSet = Boolean(ship && shipUrl && authCookie);
    const newStore: any = {
      ships: [...ships.filter((s) => s.ship !== ship), newShip],
      ship: shipSet ? ship : newShip.ship,
      shipUrl: shipSet ? shipUrl : newShip.shipUrl,
      authCookie: shipSet ? authCookie : newShip.authCookie,
    };
    
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
