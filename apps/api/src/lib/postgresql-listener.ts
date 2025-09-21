import * as pg from "pg";

export interface PostgreSQLListenerConfig {
  connectionString: string;
  reconnectInterval?: number; // milliseconds
  maxReconnectAttempts?: number;
  connectionTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  keepAlive?: boolean;
  keepAliveInitialDelayMillis?: number;
}

export interface NotificationHandler {
  (channel: string, payload: string | null): void | Promise<void>;
}

export class PostgreSQLListener {
  private client: pg.Client | null = null;
  private config: Required<PostgreSQLListenerConfig>;
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private isDestroyed = false;
  private channels: Set<string> = new Set();
  private notificationHandlers: Map<string, NotificationHandler[]> = new Map();

  constructor(config: PostgreSQLListenerConfig) {
    this.config = {
      connectionString: config.connectionString,
      reconnectInterval: config.reconnectInterval ?? 5000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
      connectionTimeoutMillis: config.connectionTimeoutMillis ?? 30000,
      idleTimeoutMillis: config.idleTimeoutMillis ?? 0, // Disable idle timeout
      keepAlive: config.keepAlive ?? true,
      keepAliveInitialDelayMillis: config.keepAliveInitialDelayMillis ?? 30000,
    };
  }

  /**
   * Connect to PostgreSQL and setup LISTEN channels
   */
  async connect(): Promise<void> {
    if (this.isConnecting || this.isDestroyed) {
      return;
    }

    this.isConnecting = true;

    try {
      // Clean up existing client if any
      if (this.client) {
        await this.cleanup();
      }

      console.log("[PostgreSQLListener] Connecting to database...");

      // Create new client with enhanced configuration
      this.client = new pg.Client({
        connectionString: this.config.connectionString,
        connectionTimeoutMillis: this.config.connectionTimeoutMillis,
        keepAlive: this.config.keepAlive,
        keepAliveInitialDelayMillis: this.config.keepAliveInitialDelayMillis,
      });

      // Setup error handler before connecting
      this.client.on("error", this.handleConnectionError.bind(this));
      this.client.on("end", this.handleConnectionEnd.bind(this));
      this.client.on("notification", this.handleNotification.bind(this));

      // Connect with timeout
      await this.client.connect();

      // Re-establish LISTEN commands for all channels
      for (const channel of Array.from(this.channels)) {
        await this.client.query(`LISTEN ${channel}`);
      }

      console.log(
        `[PostgreSQLListener] Connected successfully. Listening to channels: ${Array.from(this.channels).join(", ")}`,
      );

      // Reset reconnect attempts on successful connection
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error("[PostgreSQLListener] Connection failed:", error);
      await this.handleConnectionError(error as Error);
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Start listening to a PostgreSQL channel
   */
  async listen(channel: string, handler: NotificationHandler): Promise<void> {
    // Store channel and handler
    this.channels.add(channel);

    const handlers = this.notificationHandlers.get(channel) || [];
    handlers.push(handler);
    this.notificationHandlers.set(channel, handlers);

    // If we have an active connection, start listening immediately
    if (this.client && !this.isDestroyed) {
      try {
        await this.client.query(`LISTEN ${channel}`);
        console.log(`[PostgreSQLListener] Started listening to channel: ${channel}`);
      } catch (error) {
        console.error(`[PostgreSQLListener] Failed to LISTEN to ${channel}:`, error);
        // Connection will be re-established by error handler
      }
    }
  }

  /**
   * Stop listening to a PostgreSQL channel
   */
  async unlisten(channel: string): Promise<void> {
    this.channels.delete(channel);
    this.notificationHandlers.delete(channel);

    if (this.client && !this.isDestroyed) {
      try {
        await this.client.query(`UNLISTEN ${channel}`);
        console.log(`[PostgreSQLListener] Stopped listening to channel: ${channel}`);
      } catch (error) {
        console.error(`[PostgreSQLListener] Failed to UNLISTEN ${channel}:`, error);
      }
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.client !== null && !this.isDestroyed && !this.isConnecting;
  }

  /**
   * Gracefully close the connection
   */
  async destroy(): Promise<void> {
    this.isDestroyed = true;

    // Cancel any pending reconnection
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    await this.cleanup();
    console.log("[PostgreSQLListener] Destroyed");
  }

  private async cleanup(): Promise<void> {
    if (this.client) {
      try {
        // Remove all listeners to prevent memory leaks
        this.client.removeAllListeners();

        // Try to end the connection gracefully
        await this.client.end();
      } catch (error) {
        console.warn("[PostgreSQLListener] Error during cleanup:", error);
      } finally {
        this.client = null;
      }
    }
  }

  private handleNotification(msg: pg.Notification): void {
    const channel = msg.channel;
    const payload = msg.payload || null;

    const handlers = this.notificationHandlers.get(channel) || [];

    // Execute all handlers for this channel
    handlers.forEach(async (handler) => {
      try {
        await handler(channel, payload);
      } catch (error) {
        console.error(
          `[PostgreSQLListener] Notification handler error for channel ${channel}:`,
          error,
        );
      }
    });
  }

  private async handleConnectionError(error: Error): Promise<void> {
    console.error("[PostgreSQLListener] Connection error:", error.message);

    // Clean up the failed connection
    await this.cleanup();

    // Attempt to reconnect if not destroyed
    if (!this.isDestroyed) {
      await this.scheduleReconnect();
    }
  }

  private async handleConnectionEnd(): Promise<void> {
    console.warn("[PostgreSQLListener] Connection ended unexpectedly");

    // Clean up the ended connection
    await this.cleanup();

    // Attempt to reconnect if not destroyed
    if (!this.isDestroyed) {
      await this.scheduleReconnect();
    }
  }

  private async scheduleReconnect(): Promise<void> {
    // Don't schedule if already scheduled or destroyed
    if (this.reconnectTimeout || this.isDestroyed) {
      return;
    }

    // Check if we've exceeded max attempts
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error(
        `[PostgreSQLListener] Max reconnection attempts (${this.config.maxReconnectAttempts}) exceeded. Giving up.`,
      );
      return;
    }

    this.reconnectAttempts++;

    // Calculate backoff delay (exponential backoff with jitter)
    const baseDelay = this.config.reconnectInterval;
    const exponentialDelay = baseDelay * Math.pow(2, this.reconnectAttempts - 1);
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    const delay = Math.min(exponentialDelay + jitter, 60000); // Cap at 1 minute

    console.log(
      `[PostgreSQLListener] Scheduling reconnection attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} in ${Math.round(delay)}ms`,
    );

    this.reconnectTimeout = setTimeout(async () => {
      this.reconnectTimeout = null;

      if (!this.isDestroyed) {
        await this.connect();
      }
    }, delay);
  }
}
