import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Sentry from "@sentry/react-native"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type UserCreditsState = {
  userCredits: number | null
  maxUserCredits: number | null
  setUserCredits: (userCredits: number) => void
  setUserCreditsFromResponse: (response: Response) => void

  /**
   * Hydration
   */
  reset: () => void
  isReady: boolean
  setReady: () => void
}

export const useUserCreditsStore = create<UserCreditsState>()(
  persist(
    (set) => ({
      userCredits: null,
      maxUserCredits: null,
      setUserCredits(userCredits) {
        set({ userCredits })
      },
      setUserCreditsFromResponse(response) {
        try {
          // rate limits are passed via headers from calls to the completions api endpoint
          const userCredits = response.headers.get("x-credits-remaining")
          const maxCredits = response.headers.get("x-credits-limit")

          set((state) => {
            if (userCredits !== null) {
              state.userCredits = Number.parseInt(userCredits)
            }

            if (maxCredits !== null) {
              state.maxUserCredits = Number.parseInt(maxCredits)
            }

            return state
          })

          if (userCredits !== null) {
            set({ userCredits: parseInt(userCredits) })
          }
        } catch (e) {
          console.error("Error setting user credits from response", e)
          Sentry.captureException(e)
        }
      },

      // Hydration
      reset: () => {
        set({
          userCredits: null,
          maxUserCredits: null
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
      name: "xyz.catena.user-credits",

      /**
       * Use the AsyncStorage to store keys
       */
      storage: createJSONStorage(() => AsyncStorage),

      /**
       * Version of the data store
       */
      version: 0
    }
  )
)
