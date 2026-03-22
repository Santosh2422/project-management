import { create, StateCreator } from 'zustand';
import createSelectors from './selectors';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

type AuthState = {
  accessToken: string | null;
  user: null;
  setAccessToekn: (token: string) => void;
  clearAccessToekn: () => void;
};

const createAuthSlice: StateCreator<AuthState> = (set) => ({
  accessToken: null,
  user: null,
  setAccessToekn: (token) => set({ accessToken: token }),
  clearAccessToekn: () => set({ accessToken: null }),
});

type StoreType = AuthState;

export const useStoreBase = create<StoreType>()(
  persist(
    immer((...a) => ({
      ...createAuthSlice(...a),
    })),
    {
      name: 'app-session',
      getStorage: () => sessionStorage,
    }
  )
);

export const useStore = createSelectors(useStoreBase);
