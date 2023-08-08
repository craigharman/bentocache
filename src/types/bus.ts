/**
 * Interface for the a bus driver
 */
export interface BusDriver {
  /**
   * Publish a message to a channel
   */
  publish(channel: string, message: Omit<CacheBusMessage, 'busId'>): Promise<void>
  subscribe(channel: string, handler: (message: CacheBusMessage) => void): Promise<void>
  unsubscribe(channel: string): Promise<void>
  disconnect(): Promise<void>

  onReconnect(callback: () => void): void
}

/**
 * Interface for the bus encoder
 *
 * Bus encoders are responsible for encoding and decoding messages
 * when they are sent and received from the bus.
 */
export interface BusEncoder {
  encode(message: CacheBusMessage): string | Buffer
  decode(data: string): CacheBusMessage
}

/**
 * Message sent over the cache bus
 */
export interface CacheBusMessage {
  busId: string
  keys: string[]
  type: CacheBusMessageType
}

export enum CacheBusMessageType {
  /**
   * An item was set in the cache
   */
  Set = 'set',

  /**
   * An item was deleted from the cache
   */
  Delete = 'delete',
}
