# AGENTS.md — PROJECT CONSTITUTION
> Re-read this file at the start of every phase. It overrides any assumption you would otherwise make.

---

## SURFACES — six routes, one backend
```
/t/:qrToken   dine-in customer menu, opened by scanning a table QR, no login
/kiosk        takeaway self-service touchscreen, no login, fullscreen
/kitchen      chef display            (role CHEF)
/staff        waiter + cashier        (role STAFF)
/admin        manager dashboard       (role ADMIN)
/board        public pickup display   no login
```

## TECH STACK — MUST NOT be substituted
```
Client: React 18 + Vite + Tailwind CSS + React Router + Recharts
Server: Node.js + Express + Mongoose
DB: MongoDB      Realtime: Socket.io      Auth: JWT + bcrypt
QR: `qrcode` to generate, `html5-qrcode` to scan
Payments: internal mock gateway behind a swappable interface
NEVER introduce a paid service, SMS provider, or any cloud service
requiring a credit card.
```

## REPO STRUCTURE
```
/server  routes, controllers, models, middleware, sockets, jobs, tests
/client  all six surfaces as routes, shared components, hooks
/docs    schema.md, api-contract.md, test-cases.md
/design  UI reference images — if present, MUST be matched
AGENTS.md  README.md  .env.example
```

## DATA MODEL — authoritative. Reuse exactly. NEVER create a parallel model.
```
User        { _id, name, email, passwordHash, role: ADMIN|STAFF|CHEF, active }
Table       { _id, number, capacity, status: FREE|OCCUPIED|BILLED|CLEANING,
              qrToken, currentSessionId }
MenuItem    { _id, name, category, description, basePrice,
              variants:[{name, priceDelta}], addOns:[{name, price}],
              imageUrl, isVeg, available, avgPrepMinutes }
TableSession{ _id, tableId, startedAt, closedAt, runningTotal,
              status: OPEN|BILL_REQUESTED|PAID|CLOSED }
Order       { _id, orderType: DINE_IN|TAKEAWAY, source: QR|KIOSK|STAFF,
              sessionId|null, tableNumber|null, token|null,
              items:[OrderItem], subtotal, specialInstructions,
              status: PLACED|CLAIMED|COMPLETED|SERVED|COLLECTED|CANCELLED,
              claimedBy|null, claimedAt, completedAt, servedAt, createdAt }
OrderItem   { menuItemId, name, variant, addOns[], qty, unitPrice, lineTotal }
Bill        { _id, sessionId|orderId, subtotal, cgst, sgst, serviceCharge,
              discount, total, status: UNPAID|PAID }
Payment     { _id, billId, mode: ONLINE|CASH, status, collectedBy, txnRef, paidAt }
```

## ORDER LIFECYCLE
```
PLACED → CLAIMED → COMPLETED → SERVED (dine-in) | COLLECTED (takeaway)
Customer-facing labels: "Order received" / "Being prepared" / "Ready"
```

## TEN NON-NEGOTIABLE RULES
1. Every price, subtotal and tax MUST be recalculated SERVER-SIDE from
   MenuItem documents. NEVER trust any amount sent by a client.
2. A table QR MUST encode a signed JWT (payload {tableId, number}) verified
   server-side. NEVER put a raw table id or number in the URL.
3. Chef claiming MUST be atomic:
     findOneAndUpdate(
       { _id, claimedBy: null, status: 'PLACED' },
       { $set: { claimedBy, claimedAt: new Date(), status: 'CLAIMED' } },
       { new: true })
   Return HTTP 409 when it returns null. NEVER read-then-write, NEVER
   guard the claim in application code alone.
4. Only the claiming chef or an ADMIN may mark an order COMPLETED.
5. Takeaway token numbers MUST be unique under concurrency and reset daily.
   Use an atomic counter document. NEVER read-max-then-increment.
6. A Table returns to FREE only after a cashier confirms payment and the
   session is CLOSED. A takeaway order MUST NOT reach COLLECTED while its
   bill is UNPAID.
7. Socket.io MUST use rooms: table:<tableId>, kiosk:<orderId>, role:kitchen,
   role:staff, board. NEVER broadcast order data to all connected clients.
8. A bill is marked PAID only after server-side verification of the payment.
   NEVER mark paid from a browser success callback alone.
9. GST = CGST 2.5% + SGST 2.5% of subtotal, rounded to 2 decimals.
10. Every mutating route MUST be input-validated and role-protected.

---

## PHASES — complete in order, one per task
- P1 FOUNDATION — models, auth, menu CRUD, table CRUD + QR, seed, /docs stubs
- P2 ADMIN CORE — /admin shell, menu manager, table manager, QR sheet, staff accounts
- P3 DINE-IN — /t/:qrToken surface, session management, live status, bill request
- P4 KIOSK — /kiosk surface, atomic daily token, inactivity reset, live status
- P5 KITCHEN — /kitchen display, atomic claim, timers, auto-release job
- P6 FULFILMENT — /board, /staff surfaces, Web Push, room routing
- P7 BILLING — Bill generation, MockGateway, cash mode, Rules 6 and 8
- P8 ANALYTICS — /admin dashboard, Recharts charts, aggregation pipelines, CSV export
- P9 HARDENING — Jest + Supertest suite, E2E browser flows, README, .env.example

---

## ALLOWED ACTIONS
- Create and edit files inside /server, /client, /docs, and root config files
- Install npm packages required by the locked stack
- Run the dev servers and the test suite locally
- Drive the browser to verify flows and capture screenshots

## FORBIDDEN ACTIONS
- Do NOT substitute any technology in the locked stack
- Do NOT redefine, rename or duplicate any model in the data model
- Do NOT integrate any paid or card-requiring service
- Do NOT write secrets or connection strings into committed files; use
  .env.example with placeholder names only
- Do NOT delete files without showing me a diff first
- Do NOT start a later phase before I approve the current one
- Do NOT weaken any of the ten rules for convenience

## STOP CONDITIONS — pause and ask when:
- A phase would require a decision that changes the architecture
- The data model appears to need a new field or model
- An error is unresolved after 2 attempts
- Work would touch files outside the scope above
- A rule above appears to conflict with a working implementation

## CHECKPOINTS
- Produce a short implementation plan before each phase and WAIT for approval
- After each major step output: ✅ [what was completed]
- At the end of each phase: list every file created or changed, state which of
  the ten rules that phase enforced and where, run the app, verify in the
  browser, then commit with a conventional commit message
