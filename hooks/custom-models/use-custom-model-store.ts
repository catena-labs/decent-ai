import { createId } from "@paralleldrive/cuid2"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import { secureAsyncStorage } from "@/lib/storage/secure-async-storage"

type CustomModel = {
  // we identify the model by id, since the user could
  // want to update the model slug on a particular model
  id: string
  baseURL: string
  apiKey?: string
  modelSlug: string
  name?: string
}

type CustomModelState = {
  models: CustomModel[]
  addModel: (model: Omit<CustomModel, "id">) => void
  deleteModel: (id?: string) => void
  updateModel: (model: CustomModel) => void

  // Hydration
  isReady: boolean
  setReady: () => void
}

export const useCustomModelStore = create<CustomModelState>()(
  persist(
    (set) => ({
      models: [] as CustomModel[],

      addModel(model: Omit<CustomModel, "id">) {
        set((state) => ({
          models: [...state.models, { ...model, id: createId() }]
        }))
      },

      deleteModel(id?: string) {
        set((state) => ({
          models: state.models.filter((m) => m.id !== id)
        }))
      },

      updateModel(newModel: CustomModel) {
        set((state) => ({
          models: state.models.map((m) => (m.id === newModel.id ? newModel : m))
        }))
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
      name: "xyz.catena.custom-models",

      /**
       * Use the SecureAsyncStorage to store keys
       */
      storage: createJSONStorage(() => secureAsyncStorage()),

      /**
       * Version of the data store
       */
      version: 1,

      migrate: (persistedState, version) => {
        if (version === 0) {
          const models = (persistedState as CustomModelState).models
          // Add id to models from v0 of store that did not have them so logic does not break
          const newModels = models.map((m) => ({ ...m, id: createId() }))
          return { ...(persistedState as CustomModelState), models: newModels }
        }

        return persistedState
      },

      /**
       * Since we are using async storage, we need to mark the store as Ready
       */
      onRehydrateStorage: () => (state) => state?.setReady()
    }
  )
)
