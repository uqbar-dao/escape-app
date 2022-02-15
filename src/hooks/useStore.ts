import create from "zustand";
import storage from "../util/storage";

export interface ShipConnection {
  ship: string;
  shipUrl: string;
  authCookie?: string;
}

interface Store {
  loading: boolean;
  ship: string;
  shipUrl: string;
  authCookie: string;
  ships: ShipConnection[];
  loadStore: (store: any) => void;
  setShipUrl: (shipUrl: string) => void;
  setLoading: (loading: boolean) => void;
  addShip: (ship: ShipConnection) => void;
  removeShip: (ship: string) => void;
  setShip: (ship: string) => void;
  clearShip: () => void;
}

const useStore = create<Store>((set) => ({
  loading: true,
  ship: '',
  shipUrl: '',
  authCookie: '',
  ships: [],
  loadStore: (store: any) => set(() => store),
  setShipUrl: (shipUrl: string) => set({ shipUrl }),
  setLoading: (loading: boolean) => set({ loading }),
  addShip: (newShip: ShipConnection) => set(({ ships, ship, authCookie, shipUrl }) => {
    const shipSet = Boolean(ship && shipUrl);
    const newStore: any = {
      ships: [...ships, newShip],
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
  setShip: (selectedShip: string) => set(({ ships }) => {
    const newShip = ships.find(({ ship }) => ship === selectedShip);
    return newShip ? { ...newShip } : {};
  }),
  clearShip: () => set(() => ({ ship: '', shipUrl: '', authCookie: '' })),
}));

export default useStore;
