import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type TooltipState = {
  activeTooltip: string | null
  closedTooltips: string[]
  showTooltip: (id: string) => void
  closeTooltip: (id: string) => void
}

export const useTooltipStore = create<TooltipState>()(
  persist(
    (set) => ({
      activeTooltip: null as string | null,
      closedTooltips: [] as string[],

      showTooltip: (id) => {
        set((state) => {
          // If there's already an active tooltip, don't show
          if (state.activeTooltip) {
            return state
          }

          // If this tooltip has been closed, dont show
          if (state.closedTooltips.includes(id)) {
            return state
          }

          return {
            activeTooltip: id
          }
        })
      },

      closeTooltip: (id) => {
        set((state) => ({
          activeTooltip:
            state.activeTooltip === id ? null : state.activeTooltip,
          closedTooltips: [...state.closedTooltips, id]
        }))
      }
    }),
    {
      /**
       * Name of the item in storage
       */
      name: "xyz.catena.tooltips",

      /**
       * Use the SecureAsyncStorage to store keys
       */
      storage: createJSONStorage(() => AsyncStorage),

      /**
       * Version of the data store
       */
      version: 0
    }
  )
)
