import { ShipConnection } from "../state/useStore";

export const getCurrentPath = (ship: string, ships: ShipConnection[]) => ships.find(s => s.ship === ship)?.currentPath || '';
