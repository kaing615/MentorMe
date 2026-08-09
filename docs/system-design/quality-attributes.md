# Quality Attributes

**Implementation status:** Target

| Attribute | Gate |
| --- | --- |
| Load | 100 RPS, 100 concurrent users, 100–200 WebSockets |
| Read latency | p95 below 300 ms |
| Write latency | p95 below 500 ms |
| Realtime delivery | p95 below 200 ms inside the VPS region |
| Availability objective | 99.5% monthly core-system availability |
| Recovery point | 24 hours, backed by Atlas daily backup |
| Recovery time | 60 minutes, proven by clean-host restore drill |

The production host starts at 2 vCPU, 4 GB RAM, and 80 GB SSD with at least 20% headroom. A rolling release may reduce capacity to one API replica, so one replica must pass the acceptance load gate before CD is enabled. Results are recorded with host size, dataset, Git SHA, percentile output, restart count, and queue growth; unmet gates remain visible failures.
