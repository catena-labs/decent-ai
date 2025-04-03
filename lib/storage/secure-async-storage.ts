import * as SecureStore from "expo-secure-store"

import { logger } from "@/lib/logger"

import type { StateStorage } from "zustand/middleware"

function buildKey(key: string, id?: string): string {
  return id ? `${id}-${key}` : key
}

/**
 * This module wraps [`expo-secure-store`](https://docs.expo.dev/versions/latest/sdk/securestore/)
 * to match the [AsyncStorage](https://github.com/react-native-async-storage/async-storage)
 * API, allowing simple setting and getting of values that are stored using
 * Keychain services on iOS and Keystore encryption on Android.
 *
 * This storage item can be used with [zustand](https://github.com/pmndrs/zustand).
 *
 * @example
 * ```
 * import { SecureAsyncStorage } from "@/lib/secure-async-storage"
 * ```
 */

class SecureAsyncStorage {
  id?: string

  constructor(id?: string) {
    this.id = id
  }

  /**
   * Get an item from secure storage.
   */
  getItem(key: string): Promise<string | null> {
    const fullKey = buildKey(key, this.id)
    logger.debug("(secure-async-storage) getItem", fullKey)
    return SecureStore.getItemAsync(fullKey)
  }

  /**
   * Save an item to secure storage.
   */
  setItem(key: string, value: string): Promise<void> {
    const fullKey = buildKey(key, this.id)
    logger.debug("(secure-async-storage) setItem", fullKey)
    return SecureStore.setItemAsync(fullKey, value)
  }

  /**
   * Remove an item from secure storage.
   */
  removeItem(key: string): Promise<void> {
    const fullKey = buildKey(key, this.id)
    logger.debug("(secure-async-storage) removeItem", fullKey)
    return SecureStore.deleteItemAsync(fullKey)
  }
}

/**
 *
 */
export function secureAsyncStorage(id?: string): StateStorage {
  return new SecureAsyncStorage(id)
}
