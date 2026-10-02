# API Contract

> Base URL: http://localhost:5000
> All responses: { success: boolean, ...data } or { success: false, error: string }
> Auth header: Authorization: Bearer <JWT>

---

## Auth

### POST /api/auth/login
| | |
|---|---|
| Auth | None |
| Body | { email: string, password: string } |
| 200 | { success: true, token: string, user: { _id, name, email, role } } |
| 401 | Invalid credentials |
| 422 | Validation error |

### GET /api/auth/me
| | |
|---|---|
| Auth | Bearer JWT |
| 200 | { success: true, user: User } |
| 401 | No token / invalid token |

---

## Users (Staff & Access Control — Phase 2)

### GET /api/users
| | |
|---|---|
| Auth | ADMIN |
| 200 | { success: true, users: User[] } — safe projection (passwordHash omitted) |
| 401/403 | Auth/role failure |

### POST /api/users
| | |
|---|---|
| Auth | ADMIN |
| Body | { name: string, email: string, password: string (min 6), role: ADMIN\|STAFF\|CHEF, active?: boolean } |
| Action | Hashes password with bcrypt; validates inputs (Rule 10) |
| 201 | { success: true, user: User } |
| 409 | User with this email already exists |
| 422 | Validation error |

### PATCH /api/users/:id
| | |
|---|---|
| Auth | ADMIN |
| Body | { name?: string, role?: ADMIN\|STAFF\|CHEF, active?: boolean, password?: string (min 6) } |
| Action | Updates fields, re-hashes password if provided; prevents self-deactivation (Rule 10) |
| 200 | { success: true, user: User } |
| 400 | Self-deactivation forbidden |
| 404 | User not found |
| 422 | Validation error |

---

## Menu

### GET /api/menu
| | |
|---|---|
| Auth | None (public) |
| 200 | { success: true, items: MenuItem[] } — available items only |

### GET /api/menu/all
| | |
|---|---|
| Auth | ADMIN |
| 200 | { success: true, items: MenuItem[] } — all items incl unavailable |
| 401/403 | Auth/role failure |

### POST /api/menu
| | |
|---|---|
| Auth | ADMIN |
| Body | { name, category, basePrice, description?, variants?, addOns?, isVeg?, avgPrepMinutes? } |
| 201 | { success: true, item: MenuItem } |
| 422 | Validation error |

### PATCH /api/menu/:id
| | |
|---|---|
| Auth | ADMIN |
| Body | Any MenuItem fields to update, incl. available: boolean |
| 200 | { success: true, item: MenuItem } |
| 404 | Item not found |

### DELETE /api/menu/:id
| | |
|---|---|
| Auth | ADMIN |
| Action | Soft-delete: sets available=false |
| 200 | { success: true, message, item } |
| 404 | Item not found |

---

## Tables

### GET /api/tables
| | |
|---|---|
| Auth | ADMIN or STAFF |
| 200 | { success: true, tables: Table[] } sorted by number |

### POST /api/tables
| | |
|---|---|
| Auth | ADMIN |
| Body | { number: int, capacity: int } |
| Action | Creates table; signs QR JWT with {tableId, number} using QR_JWT_SECRET (Rule 2) |
| 201 | { success: true, table: Table } |
| 422 | Validation error |

### PATCH /api/tables/:id
| | |
|---|---|
| Auth | ADMIN |
| Body | { status?: FREE|OCCUPIED|BILLED|CLEANING, capacity?: int } |
| 200 | { success: true, table: Table } |
| 404 | Table not found |

### GET /api/tables/qr/:qrToken
| | |
|---|---|
| Auth | None (public) |
| Action | jwt.verify(token, QR_JWT_SECRET) then returns table info (Rule 2) |
| 200 | { success: true, table: { _id, number, capacity, status, currentSessionId } } |
| 400 | Invalid or tampered QR code |
| 404 | Table not found |

### POST /api/tables/:id/regenerate-qr
| | |
|---|---|
| Auth | ADMIN |
| Action | Re-signs QR JWT for the table (Rule 2) |
| 200 | { success: true, table: Table } |
| 404 | Table not found |

### GET /api/tables/qr-sheet
| | |
|---|---|
| Auth | ADMIN |
| Action | Generates high-res QR code base64 Data URLs encoding /t/:qrToken for all tables (Rule 2) |
| 200 | { success: true, tables: Array<{ _id, number, capacity, status, qrToken, qrUrl, qrDataUrl }> } |
| 401/403 | Auth/role failure |

---

## Future Phases (stubs — not yet implemented)

| Method | Path | Phase | Description |
|---|---|---|---|
| POST | /api/orders | P3/P4 | Place order (server recalculates price — Rule 1) |
| PATCH | /api/orders/:id/claim | P5 | Atomic claim (Rule 3) |
| PATCH | /api/orders/:id/complete | P5 | Mark complete (Rule 4) |
| PATCH | /api/orders/:id/serve | P6 | Mark served |
| PATCH | /api/orders/:id/collect | P6 | Mark collected (Rule 6) |
| POST | /api/bills | P7 | Generate bill (Rule 9 GST) |
| POST | /api/payments | P7 | Initiate payment |
| POST | /api/payments/:id/verify | P7 | Server-side verify (Rule 8) |
| GET | /api/analytics/* | P8 | Aggregation pipelines |