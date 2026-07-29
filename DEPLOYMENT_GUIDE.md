# PostgreSQL Connection Fix - Deployment Guide

This guide covers deploying and monitoring the WebSocket disconnection fix.

## 🚀 Deployment Steps

### 1. Environment Variables (Optional)

The following environment variables can be set to customize PostgreSQL connection behavior:

```bash
# PostgreSQL LISTEN/NOTIFY Connection Settings (optional - defaults provided)
PG_LISTENER_RECONNECT_INTERVAL=5000      # Base reconnection interval in milliseconds
PG_LISTENER_MAX_RECONNECT_ATTEMPTS=50    # Maximum reconnection attempts
PG_LISTENER_CONNECTION_TIMEOUT=30000     # Connection timeout in milliseconds
PG_LISTENER_KEEPALIVE_DELAY=30000        # TCP keepalive initial delay in milliseconds
```

**Note**: If not set, the system will use production-ready defaults.

### 2. Deployment Process

1. **Build and Test Locally**

   ```bash
   cd apps/api
   npm run build
   npm test  # Run any existing tests
   ```

2. **Deploy to Staging**

   ```bash
   # Deploy using your preferred method (Render, Docker, etc.)
   # The fix will automatically activate on startup
   ```

3. **Verify Deployment**
   ```bash
   # Use the verification script
   API_BASE_URL=https://api.staging.your-domain.com ./scripts/verify-pg-fix.sh
   ```

## 📊 Monitoring

### Health Check Endpoints

The fix adds two new monitoring endpoints:

#### 1. PostgreSQL Listener Health Check

```bash
GET /health/pg-listener
```

**Response (Healthy)**:

```json
{
  "healthy": true,
  "status": "healthy",
  "details": {
    "status": "healthy",
    "isConnected": true,
    "lastConnectionTime": "2024-01-21T15:30:00.000Z",
    "reconnectAttempts": 0,
    "uptime": 1800000
  },
  "metrics": {
    "totalConnections": 1,
    "successfulConnections": 1,
    "failedConnections": 0,
    "totalNotifications": 42,
    "totalNotificationErrors": 0,
    "currentUptime": 1800000
  },
  "timestamp": "2024-01-21T15:30:00.000Z"
}
```

**Response (Unhealthy)**:

```json
{
  "healthy": false,
  "status": "reconnecting",
  "details": {
    "status": "reconnecting",
    "isConnected": false,
    "lastError": "Connection terminated unexpectedly",
    "reconnectAttempts": 3,
    "uptime": 0
  },
  "timestamp": "2024-01-21T15:30:00.000Z"
}
```

#### 2. PostgreSQL Listener Metrics

```bash
GET /metrics/pg-listener
```

**Response**:

```json
{
  "status": "healthy",
  "metrics": {
    "totalConnections": 5,
    "successfulConnections": 4,
    "failedConnections": 1,
    "totalNotifications": 156,
    "totalNotificationErrors": 0,
    "currentUptime": 3600000,
    "lastConnectionError": "Connection timeout",
    "lastConnectionErrorTime": "2024-01-21T14:45:00.000Z"
  },
  "summary": "Status: healthy | Connected: true | Uptime: 3600s | Notifications: 156 | Success rate: 80%",
  "timestamp": "2024-01-21T15:30:00.000Z"
}
```

### Monitoring Integration

#### 1. Add to Existing Health Checks

Update your monitoring/alerting system to include:

```bash
# Health check script addition
curl -f https://your-api.com/health/pg-listener || exit 1
```

#### 2. Metrics Collection

For monitoring dashboards (e.g., Grafana, DataDog), query:

```bash
# Collect metrics every minute
curl -s https://your-api.com/metrics/pg-listener | jq '.metrics'
```

**Key Metrics to Monitor**:

- `status`: Should be "healthy"
- `currentUptime`: Should increase over time
- `successfulConnections / totalConnections`: Should be > 95%
- `totalNotificationErrors`: Should remain 0 or very low

#### 3. Alerting Rules

Set up alerts for:

```yaml
# Example monitoring rules
- alert: PostgreSQLListenerDown
  condition: status != "healthy" for > 5 minutes

- alert: PostgreSQLListenerHighFailureRate
  condition: (failedConnections / totalConnections) > 0.1

- alert: PostgreSQLListenerStuckReconnecting
  condition: status == "reconnecting" for > 10 minutes
```

## 🔍 Verification Process

### Automated Verification

Use the provided script to verify the fix:

```bash
# Run verification script (monitors for 15-40 minutes)
./scripts/verify-pg-fix.sh

# Or with custom API URL
API_BASE_URL=https://your-api.com ./scripts/verify-pg-fix.sh
```

The script will:

- Monitor connection health every 30 seconds
- Check for the old disconnection pattern
- Report success/failure after monitoring period
- Exit with code 0 on success, >0 on failure

### Manual Verification

1. **Check Initial Status**

   ```bash
   curl https://your-api.com/health/pg-listener | jq '.details.status'
   # Should return: "healthy"
   ```

2. **Monitor for 30+ Minutes**

   ```bash
   # Check that uptime keeps increasing (no disconnections)
   while true; do
     uptime=$(curl -s https://your-api.com/metrics/pg-listener | jq '.metrics.currentUptime')
     echo "Uptime: ${uptime}ms ($(($uptime / 60000))m)"
     sleep 60
   done
   ```

3. **Check for Old Error Pattern**
   ```bash
   # In your application logs, you should NOT see:
   # "Connection terminated unexpectedly"
   # "Error: Connection terminated unexpectedly"
   ```

### Success Criteria

The fix is working correctly if:

- ✅ `/health/pg-listener` reports "healthy" status
- ✅ Connection uptime continues to increase beyond 6+ minutes
- ✅ No "Connection terminated unexpectedly" errors in logs
- ✅ WebSocket subscriptions remain stable for extended periods
- ✅ Success rate remains above 95%

### Rollback Plan

If issues are detected:

1. **Immediate Rollback**

   ```bash
   # Revert to previous deployment
   git revert <commit-hash>
   # Redeploy
   ```

2. **Temporary Mitigation**
   - Monitor existing error handling
   - Client-side reconnection should still work
   - The old behavior will resume (6-minute disconnection cycle)

## 🎯 Expected Results

### Before Fix

- WebSocket connections terminated every ~6 minutes
- "Connection terminated unexpectedly" errors in logs
- Clients experienced frequent reconnections
- Real-time updates interrupted regularly

### After Fix

- WebSocket connections remain stable indefinitely
- Automatic reconnection on rare actual disconnections
- Smooth real-time experience for users
- Reduced client-side error handling

## 📞 Support

If you encounter issues:

1. Check the health endpoints first
2. Review application logs for PostgreSQL connection errors
3. Verify environment variables (if customized)
4. Run the verification script for detailed diagnostics

The fix is designed to be backwards compatible and should not impact existing functionality.
