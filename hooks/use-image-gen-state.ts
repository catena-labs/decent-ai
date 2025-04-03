import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type ImageGenState = {
  /**
   * Controls what model is used for image generation
   */
  currentModelSlug: string | undefined
  setCurrentModelSlug: (currentModelSlug: string) => void

  /**
   * Hydration
   */
  isReady: boolean
  setReady: () => void
}

export const useImageGenState = create<ImageGenState>()(
  persist(
    (set) => ({
      currentModelSlug: undefined,
      setCurrentModelSlug: (currentModelSlug) => {
        set({ currentModelSlug })
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
      name: "xyz.catena.image-gen",

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
        currentModelSlug: state.currentModelSlug
      }),

      /**
       * Since we are using async storage, we need to mark the store as Ready
       */
      onRehydrateStorage: () => (state) => state?.setReady()
    }
  )
)
