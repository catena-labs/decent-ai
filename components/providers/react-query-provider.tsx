import AsyncStorage from "@react-native-async-storage/async-storage"
import { addEventListener } from "@react-native-community/netinfo"
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister"
import { QueryClient, focusManager, onlineManager } from "@tanstack/react-query"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { useEffect } from "react"
import { AppState } from "react-native"

import { THIRTY_DAYS } from "@/lib/utils/date-fns/dates"
import { isWeb } from "@/lib/utils/platform"

import type { PropsWithChildren } from "react"
import type { AppStateStatus } from "react-native"

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * The duration until inactive queries will be removed from the cache.
       * Queries transition to the inactive state as soon as there are no
       * observers registered, so when all components which use that query have
       * unmounted.
       *
       * It does nothing as long as a query is still in used. It only kicks in
       * as soon as the query becomes unused. After the time has passed, data
       * will be "garbage collected" to avoid the cache from growing.
       */
      gcTime: THIRTY_DAYS
    }
  }
})

function onAppStateChange(status: AppStateStatus) {
  if (!isWeb) {
    focusManager.setFocused(status === "active")
  }
}

onlineManager.setEventListener((setOnline) => {
  return addEventListener((state) => {
    setOnline(Boolean(state.isConnected))
  })
})

type ReactQueryProviderProps = PropsWithChildren<{
  setIsReady?: () => void
}>

export function ReactQueryProvider({
  children,
  setIsReady
}: ReactQueryProviderProps) {
  useEffect(() => {
    const subscription = AppState.addEventListener("change", onAppStateChange)

    return () => {
      subscription.remove()
    }
  }, [])

  return (
    <PersistQueryClientProvider
      client={queryClient}
      onSuccess={setIsReady}
      persistOptions={{
        persister: asyncStoragePersister
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
