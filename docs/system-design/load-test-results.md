# Load Test Results

**Implementation status:** Target

The repository contains reproducible k6 profiles for 100 HTTP requests per second and 100 concurrent WebSockets. No production performance result has been recorded because the Docker engine and a disposable production-sized host were unavailable during implementation.

Run the profiles only against an isolated environment:

```bash
k6 run -e BASE_URL=https://staging.example.com tests/load/http.js
k6 run -e SOCKET_URL=wss://staging.example.com/socket.io/?EIO=4\&transport=websocket -e ACCESS_TOKEN=... tests/load/websocket.js
```

Record Git SHA, host size, dataset, duration, p50/p95/p99 latency, error rate, achieved throughput, WebSocket connection success, CPU/memory, queue growth, and process restarts. A portfolio claim is permitted only after the measured thresholds pass and this page contains the raw command output or an immutable artifact link.
