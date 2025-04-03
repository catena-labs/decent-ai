import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type ChatState = {
  /**
   * Controls what model is used for image generation
   */
  lastSelectedModelSlug: string | undefined
  setLastSelectedModelSlug: (lastSelectedModelSlug: string) => void

  /**
   * Hydration
   */
  isReady: boolean
  setReady: () => void
}

export const useChatState = create<ChatState>()(
  persist(
    (set) => ({
      lastSelectedModelSlug: undefined,
      setLastSelectedModelSlug: (lastSelectedModelSlug) => {
        set({ lastSelectedModelSlug })
      },

      isReady: false,
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
      name: "xyz.catena.chat",

      /**
       * Use the AsyncStorage to store keys
       */
      storage: createJSONStorage(() => AsyncStorage),

      /**
       * Version of the data store
       */
      version: 0,

      /**
       * Partialize what we store
       */
      partialize: (state) => ({
        lastSelectedModelSlug: state.lastSelectedModelSlug
      }),

      /**
       * Since we are using async storage, we need to mark the store as Ready
       */
      onRehydrateStorage: () => (state) => state?.setReady()
    }
  )
)
