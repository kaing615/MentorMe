# ADR 0001: Scaled Modular Monolith

**Status:** Accepted

MentorMe remains one backend deployable with explicit identity/profile, course/review, cart/order/payment, availability/booking, messaging/notification, and help-request module boundaries. Two stateless processes scale HTTP/realtime capacity. This preserves simple deployment and transactions at portfolio scale; service extraction requires measured operational or ownership pressure.
