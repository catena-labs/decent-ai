import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import { secureAsyncStorage } from "../storage/secure-async-storage"

type AuthState = {
  token: string | null

  setToken: (token: string | null) => void

  /**
   * Hydration
   */
  reset: () => void
  isReady: boolean
  setReady: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null as string | null,
      setToken: (token) => {
        set({
          token
        })
      },

      reset: () => {
        set({
          token: null
        })
      },
      isReady: false as boolean,
      setReady: () => {
        set({
          isReady: true
        })
      }
    }),
    {
      /**
       * Name of the item in storage
       */
      name: "xyz.catena.auth",

      /**
       * Use the SecureAsyncStorage to store keys
       */
      storage: createJSONStorage(() => secureAsyncStorage()),

      /**
       * Version of the data store
       */
      version: 0,

      /**
       * Partialize what we store
       */
      partialize: (state) => ({
        token: state.token
      }),

      /**
       * Since we are using async storage, we need to mark the store as Ready
       */
      onRehydrateStorage: () => (state) => state?.setReady()
    }
  )
)
