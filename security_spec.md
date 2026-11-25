# Security Specification — The Adire Lagoon Hotel & Spa (`security_spec.md`)

## 1. Data Invariants
1. **Path ID & Schema Strictness**: Every document ID across `/rooms/{roomId}`, `/availability_blocks/{blockId}`, `/bookings/{bookingId}`, `/promo_codes/{codeId}`, `/corporate_inquiries/{inquiryId}`, and `/repeat_guests/{guestId}` must match `^[a-zA-Z0-9_\-]+$` with max length 64.
2. **No Shadow Fields**: Every `create` and `update` operation must strictly match the exact required and allowed keys in `firebase-blueprint.json` (`hasAll` and `hasOnly`).
3. **Numeric & Inventory Bounds**:
   - `rooms`: `availableCount >= 0 && availableCount <= totalInventory`, `pricePerNightNgn >= 1000 && pricePerNightNgn <= 10000000`.
   - `bookings`: `nights >= 1 && nights <= 90`, `roomsCount >= 1 && roomsCount <= 20`, `totalAmountNgn >= 0`.
4. **Action-Based Updates**: Updates to `rooms`, `bookings`, and `corporate_inquiries` must use `affectedKeys().hasOnly(...)` combined with full `isValid[Entity](incoming())` schema verification.

## 2. The "Dirty Dozen" Payloads (Designed to Break Identity, Integrity & State)
1. **Payload 1 (Shadow Field Injection on Booking)**: Adds `"isAdminOverride": true` to `/bookings/bk_1`. Rejected by `data.keys().hasOnly(...)`.
2. **Payload 2 (Negative Room Inventory)**: Sets `availableCount: -3` on `/rooms/classic-room`. Rejected by `data.availableCount >= 0`.
3. **Payload 3 (Inventory Overflow)**: Sets `availableCount: 999` where `totalInventory: 40`. Rejected by `data.availableCount <= data.totalInventory`.
4. **Payload 4 (Denial-of-Wallet Oversized String)**: Sends a 5,000-character `specialRequests` string in `/bookings/bk_2`. Rejected by `data.specialRequests.size() <= 600`.
5. **Payload 5 (ID Poisoning)**: Targets `/bookings/bad$id!with*spaces`. Rejected by `isValidId(bookingId)`.
6. **Payload 6 (Invalid Payment Status Enum)**: Sets `paymentStatus: "free_stay"` on `/bookings/bk_3`. Rejected by `data.paymentStatus in ['paid', 'pending_hold', 'refunded']`.
7. **Payload 7 (Type Confusion on Price)**: Sets `pricePerNightNgn: "95000"` (string instead of number) on `/rooms/classic-room`. Rejected by `data.pricePerNightNgn is number`.
8. **Payload 8 (Unbounded Array Injection)**: Passes 50 items in `selectedAddOns` on `/bookings/bk_4`. Rejected by `data.selectedAddOns.size() <= 10`.
9. **Payload 9 (Update Gap on Booking Status)**: Attempts to mutate `roomSubtotalNgn` during a front-desk check-in status update. Rejected by `affectedKeys().hasOnly(['bookingStatus', 'paymentStatus', 'paymentMethod', 'paystackReference', 'whatsappSent'])` and `incoming().roomSubtotalNgn == existing().roomSubtotalNgn`.
10. **Payload 10 (Promo Discount Above 100%)**: Creates a promo code with `discountPercent: 95`. Rejected by `data.discountPercent >= 1 && data.discountPercent <= 50`.
11. **Payload 11 (Zero-Room Corporate Block)**: Creates `/availability_blocks/blk_1` with `blockedCount: 0`. Rejected by `data.blockedCount >= 1 && data.blockedCount <= 168`.
12. **Payload 12 (Orphaned Collection Write)**: Attempts to write to `/unprotected_collection/doc_1`. Rejected by global default-deny `match /{document=**} { allow read, write: if false; }`.
