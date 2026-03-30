# 24DIGI Firestore Setup — CRM Audit

This document summarizes what is **handled** vs **not handled** in the 24Digi CRM with respect to the *24DIGI Firestore Setup Instructions* (6 modules, 18 collections).

---

## Handled in the CRM

| Item | Status |
|------|--------|
| **All 6 modules** | Configured: Challenge, Shop, User & Profile, AI & Meal Plan, Payments, Delivery Partners. |
| **All 18 collections** | Collection IDs are defined and discovered; sidebar groups them by module. |
| **Discovery** | App checks which collections exist (and are readable) in Firestore; only those appear in the sidebar. |
| **View data** | Any collection can be opened to view all documents and fields in a table. |
| **Add document** | “Add document” button opens a form to create a new document with flat fields (string, number, boolean, timestamp). Use “Timestamp (server)” for `createdAt` / `updatedAt`. |
| **Refresh** | Refresh reloads the current collection. |
| **Edit image** | On product-style collections, image URL can be updated from the table. |
| **Display names** | User-friendly labels for collections (e.g. challenge_participants → “Participants”, shop_products → “Products”). |

---

## Not handled in the CRM (use Firebase Console or backend)

| Item | Notes |
|------|--------|
| **Create collection** | Firestore has no separate “create collection” API; a collection appears when the first document is added. Do this in [Firebase Console](https://console.firebase.google.com) (Data → Start collection) or by adding the first document from the CRM. |
| **Nested maps** | “Add document” supports only flat fields. Nested `map` fields (e.g. `location`, `profile`, `gateway`) must be added/edited in Firebase Console or via an API. |
| **Arrays** | Array fields are not editable in the Add document form; use Console or backend. |
| **Delete document** | Not implemented in the CRM. |
| **Edit document (generic)** | Only “Edit image” exists; full document edit is not implemented. |
| **Field validation** | No enforcement of types or required fields; the Setup Instructions document defines the schema. |

---

## Quick reference — 18 collections

| Collection | Module | Min. docs (per guide) |
|------------|--------|------------------------|
| challenges | Challenge | 3 |
| challenge_participants | Challenge | 1 per challenge |
| challenge_rooms | Challenge | 2 |
| room_requests | Challenge | 1 |
| challenge_leaderboard | Challenge | 3 |
| challenge_activities | Challenge | 1 |
| shop_categories | Shop | 4 |
| shop_products | Shop | 2 |
| shop_cart | Shop | 1 |
| shop_wishlist | Shop | 1 |
| shop_orders | Shop | 1 |
| product_reviews | Shop | 2 |
| users | User & Profile | 2 |
| user_addresses | User & Profile | 1 |
| ai_meal_plans | AI & Meal Plan | 1 |
| ai_delivery_schedule | AI & Meal Plan | 1 |
| payments | Payments | 2 |
| delivery_partners | Delivery Partners | 1 |

---

## How to create collections and documents

1. **From Firebase Console**  
   Go to [Firebase Console](https://console.firebase.google.com) → your project → Firestore Database → Data.  
   - Click “+ Start collection” and enter the Collection ID (e.g. `challenges`).  
   - Add the first document (and subsequent ones) with the fields from the Setup Instructions. Use **Server timestamp** for `createdAt` / `updatedAt`.

2. **From the CRM**  
   - Select a collection in the sidebar (it must already exist in Firestore; if not, create it once in Console).  
   - Click **“Add document”**.  
   - Add fields: name, type (String / Number / Boolean / Timestamp (server)), value.  
   - Use **Timestamp (server)** for `createdAt` and `updatedAt`.  
   - Click **“Add document”** to save.

3. **Setup & help in the app**  
   In the CRM sidebar, click **“Firestore setup & how to create”** to open the in-app guide and see which collections are currently discovered in your project.
