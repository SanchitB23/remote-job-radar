import type { PostgreSQLListener } from "./postgresql-listener";

export interface PostgreSQLHealthStatus {
  status: "healthy" | "unhealthy" | "reconnecting";
  isConnected: boolean;
  lastConnectionTime?: Date | undefined;
  lastError?: string | undefined;
  reconnectAttempts: number;
  uptime: number; // milliseconds
}

export interface PostgreSQLMetrics {
  totalConnections: number;
  successfulConnections: number;
  failedConnections: number;
  totalNotifications: number;
  totalNotificationErrors: number;
  currentUptime: number;
  lastConnectionError?: string;
  lastConnectionErrorTime?: Date;
}

/**
 * Health monitor for PostgreSQL listener
 */
export class PostgreSQLHealthMonitor {
  private listener: PostgreSQLListener | null = null;
  private metrics: PostgreSQLMetrics;
  private lastConnectionTime?: Date;
  private lastError?: string;
  private reconnectAttempts = 0;

  constructor() {
    this.metrics = {
      totalConnections: 0,
      successfulConnections: 0,
      failedConnections: 0,
      totalNotifications: 0,
      totalNotificationErrors: 0,
      currentUptime: 0,
    };
  }

  setListener(listener: PostgreSQLListener): void {
    this.listener = listener;
  }

  recordConnectionAttempt(): void {
    this.metrics.totalConnections++;
  }

  recordConnectionSuccess(): void {
    this.metrics.successfulConnections++;
    this.lastConnectionTime = new Date();
    delete (this as any).lastError; // Remove property instead of setting to undefined
    this.reconnectAttempts = 0;
  }

  recordConnectionFailure(error: string): void {
    this.metrics.failedConnections++;
    this.lastError = error;
    this.metrics.lastConnectionError = error;
    this.metrics.lastConnectionErrorTime = new Date();
    this.reconnectAttempts++;
  }

  recordNotification(): void {
    this.metrics.totalNotifications++;
  }

  recordNotificationError(): void {
    this.metrics.totalNotificationErrors++;
  }

  getHealthStatus(): PostgreSQLHealthStatus {
    const uptime = this.lastConnectionTime ? Date.now() - this.lastConnectionTime.getTime() : 0;

    return {
      status: this.determineHealthStatus(),
      isConnected: this.listener?.isConnected() ?? false,
      lastConnectionTime: this.lastConnectionTime,
      lastError: this.lastError,
      reconnectAttempts: this.reconnectAttempts,
      uptime,
    };
  }

  getMetrics(): PostgreSQLMetrics {
    this.metrics.currentUptime = this.lastConnectionTime
      ? Date.now() - this.lastConnectionTime.getTime()
      : 0;
    return { ...this.metrics };
  }

  private determineHealthStatus(): "healthy" | "unhealthy" | "reconnecting" {
    if (!this.listener) return "unhealthy";
    if (this.listener.isConnected()) return "healthy";
    if (this.reconnectAttempts > 0) return "reconnecting";
    return "unhealthy";
  }

  generateHealthReport(): {
    healthy: boolean;
    status: string;
    details: PostgreSQLHealthStatus;
    metrics: PostgreSQLMetrics;
    timestamp: string;
  } {
    const status = this.getHealthStatus();
    const metrics = this.getMetrics();

    return {
      healthy: status.status === "healthy",
      status: status.status,
      details: status,
      metrics,
      timestamp: new Date().toISOString(),
    };
  }

  getStatusSummary(): string {
    const status = this.getHealthStatus();
    const metrics = this.getMetrics();

    return [
      `Status: ${status.status}`,
      `Connected: ${status.isConnected}`,
      `Uptime: ${Math.round(status.uptime / 1000)}s`,
      `Notifications: ${metrics.totalNotifications}`,
      `Success rate: ${metrics.totalConnections > 0 ? Math.round((metrics.successfulConnections / metrics.totalConnections) * 100) : 0}%`,
    ].join(" | ");
  }
}

// Global instance for the application
export const pgHealthMonitor = new PostgreSQLHealthMonitor();
