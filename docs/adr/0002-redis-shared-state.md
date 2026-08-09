# ADR 0002: Redis for Disposable Shared State

**Status:** Accepted

Redis supplies cache-aside data, distributed rate counters, Socket.IO pub/sub, bounded result caching, and short scheduler locks. MongoDB remains authoritative and every Redis dependency has an explicit degraded mode. This enables two replicas without letting cache loss corrupt business state.
