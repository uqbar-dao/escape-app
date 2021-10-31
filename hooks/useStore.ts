import create from "zustand";

const useStore = create((set) => ({
  shipUrl: "",
  setShipUrl: (newUrl: string) => set({ shipUrl: newUrl }),
  clearShipUrl: () => set(() => ({ shipUrl: "" })),
}));

export default useStore;
