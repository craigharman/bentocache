import { CacheItem } from './cache_item.js'
import type { CacheItemOptions } from './cache_options.js'
import type { Logger, CacheDriver } from './types/main.js'

/**
 * LocalCache is a wrapper around a CacheDriver that provides a
 * some handy methods for interacting with a local cache ( in-memory )
 */
export class LocalCache {
  #driver: CacheDriver
  #logger: Logger

  constructor(driver: CacheDriver, logger: Logger) {
    this.#driver = driver
    this.#logger = logger.child({ context: 'bentocache.localCache' })
  }

  /**
   * Get an item from the local cache
   */
  async get(key: string, options: CacheItemOptions) {
    let value: undefined | string

    /**
     * Try to get the item from the local cache
     */
    this.#logger.trace({ key }, 'getting local cache item')
    value = await this.#driver.get(key)

    /**
     * If the item is not found, return undefined
     */
    if (value === undefined) {
      this.#logger.trace({ key }, 'local cache item not found')
      return
    }

    return CacheItem.fromDriver(key, value)
  }

  /**
   * Set a new item in the local cache
   */
  async set(key: string, value: string, options: CacheItemOptions) {
    /**
     * If graceful retain is disabled and Physical TTL is 0 or less, we can just delete the item.
     */
    if (!options.isGracefulRetainEnabled && options.physicalTtl && options.physicalTtl <= 0) {
      return this.delete(key, options)
    }

    /**
     * Save the item to the local cache
     */
    this.#logger.trace({ key, value }, 'saving local cache item')
    await this.#driver.set(key, value, options.physicalTtl)
  }

  /**
   * Delete an item from the local cache
   */
  async delete(key: string, options?: CacheItemOptions) {
    this.#logger.trace({ key }, 'deleting local cache item')
    await this.#driver.delete(key)
  }

  /**
   * Delete many item from the local cache
   */
  async deleteMany(keys: string[], options?: CacheItemOptions) {
    this.#logger.trace({ keys, options }, 'deleting local cache items')
    await this.#driver.deleteMany(keys)
  }
}
