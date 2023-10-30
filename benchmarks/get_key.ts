import Keyv from 'keyv'
import { Redis } from 'ioredis'
import { Bench } from 'tinybench'
import KeyvTiered from '@keyv/tiered'
import { multiCaching, caching } from 'cache-manager'
import { redisStore } from 'cache-manager-ioredis-yet'

import 'dotenv/config'
import { BentoCache } from '../index.js'
import { redisDriver } from '../drivers/redis.js'
import { hybridDriver } from '../drivers/hybrid.js'
import { memoryDriver } from '../drivers/memory.js'
import { REDIS_CREDENTIALS } from '../test_helpers/index.js'

const bench = new Bench()

const bentocache = new BentoCache({
  default: 'tiered',
  stores: {
    redis: {
      driver: redisDriver({ connection: REDIS_CREDENTIALS }),
    },
    tiered: {
      driver: hybridDriver({
        local: memoryDriver({}),
        remote: redisDriver({ connection: REDIS_CREDENTIALS }),
      }),
    },
  },
})

const keyvRedis = new Keyv('redis://localhost:6379')
const keyv = new KeyvTiered({ remote: keyvRedis as any, local: new Keyv() })

const cacheManagerMemory = await caching('memory')
const cacheManagerRedis = await caching(await redisStore({ host: 'localhost', port: 6379 }))
const multiCache = multiCaching([cacheManagerMemory, cacheManagerRedis])

await keyv.set('key', 'value')
await bentocache.set('key', 'value')
await multiCache.set('key', 'value')

const ioredis = new Redis()

/**
 * Simple get benchmark
 */
bench
  .add('ioredis', async () => {
    await ioredis.get('key')
  })
  .add('BentoCache', async () => {
    await bentocache.get('key')
  })
  .add('Keyv', async () => {
    await keyv.get('key')
  })
  .add('CacheManager', async () => {
    await multiCache.get('key')
  })

await bench.run()
console.table(bench.table())

await Promise.all([
  bentocache.disconnectAll(),
  ioredis.quit(),
  cacheManagerRedis.store.client.disconnect(),
  keyvRedis.disconnect(),
])