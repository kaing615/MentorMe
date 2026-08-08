# MentorMe Diagrams

The editable Draw.io sources contain all ten approved views:

- `mentorme-c4.drawio`: system context, container/deployment topology, and backend modules.
- `mentorme-domain.drawio`: domain ERD, booking/order/payment classes, and state machines.
- `mentorme-flows.drawio`: booking, payment/outbox, cross-replica WebSocket, and CI/CD flows.

The checked-in SVG files are lightweight repository previews built from the same approved model. The current workstation does not have Draw.io Desktop, Graphviz, or Python, so they are not CLI exports and visual CLI self-review was not available. When Draw.io Desktop is available, regenerate the final embedded exports from each source and compare them before replacing these previews:

```powershell
& "C:\Program Files\draw.io\draw.io.exe" -x -f svg -e -o docs/diagrams/exports/mentorme-c4.svg docs/diagrams/mentorme-c4.drawio
& "C:\Program Files\draw.io\draw.io.exe" -x -f svg -e -o docs/diagrams/exports/mentorme-domain.svg docs/diagrams/mentorme-domain.drawio
& "C:\Program Files\draw.io\draw.io.exe" -x -f svg -e -o docs/diagrams/exports/mentorme-flows.svg docs/diagrams/mentorme-flows.drawio
```

Structural Draw.io checks are part of the documentation verification gate, so missing roots, duplicate IDs, dangling endpoints, and malformed edges fail locally and in CI.
