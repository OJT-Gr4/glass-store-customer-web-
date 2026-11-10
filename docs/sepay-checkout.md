# SePay customer checkout — GLAS-2

## Behavior

- Existing cart and checkout dialog are retained. Customers explicitly select SePay
  bank transfer. Availability comes from the authenticated backend configuration API.
  Missing merchant configuration disables checkout with a clear message; no fake COD,
  card or alternate gateway option is offered.
- `POST /api/orders` sends the selected `VIETQR` method and a retry key. The cart is
  cleared only after a persisted order ID/code is returned. Browser session storage
  preserves the cart and retry key across reload after a lost response. Changing the
  request content generates a new key; logout clears cart and the checkout claim.
- After creation, `/orders/{orderCode}` loads the saved order and payment history,
  initiates payment once and submits the returned fields as a POST form to the exact
  SePay sandbox checkout URL. Field insertion order and values are preserved. No
  merchant secret or IPN secret is stored in frontend code.
- If initiation fails, the saved order remains visible. Retry charges that order,
  rather than creating another one. Reload/back navigation does not automatically
  initiate another payment. Leaving the page aborts initiation before a form redirect.
- Provider return parameters (`success`, `error`, `cancel`) never set a paid status.
  The page reads the order and payment history from authenticated API endpoints;
  only SUCCESS payment data shows confirmed payment. Cancelled/refunded orders
  cannot be charged again. Missing payment audit remains unconfirmed.
- Pending orders poll every five seconds for up to two minutes while the tab is
  visible, with manual refresh afterwards. Network errors preserve the known order
  and block another payment until status can be checked again.
- `/orders` lists the current customer's actual orders from the backend; mock order
  data and the old VNPay success screen have been removed. Customer identity and
  ownership are enforced server-side, not via a client-supplied customer ID.

## Running

Use Node + Vite, backend gateway at port 8080 and customer web at port 5184 in this
workspace. For production hosting, rewrite `/orders` and `/orders/*` to `index.html`
while retaining API proxy routes, so provider returns and reloads reach React.

Backend environment variables and HTTPS IPN setup are documented in the backend's
`docs/engineering/GLAS-2-sepay-api.md`. Never configure `SEPAY_SECRET_KEY` or
`SEPAY_IPN_SECRET` as a `VITE_*` variable. Only a configured sandbox merchant and
an actual received sandbox IPN can satisfy full provider acceptance.

## Verification — 2026-11-09

- `npm test`: 27 tests passed, including payment state, allowed form destination,
  POST field order, ownership error propagation and retry keys across reload.
- `npm run build`: successful.
- Backend: 134 order + 4 gateway tests passed on isolated H2, including concurrent
  callbacks, amount/reference changes and inventory acknowledgement failure.
- Chrome desktop/mobile: missing real merchant blocks checkout; isolated browser
  API fixtures verify cart retention after failure/reload, same key on retry,
  same-order payment retry, POST redirect, false success return, confirmed state,
  cancellation and no horizontal overflow at 390px. No MySQL order was created.
- Actual SePay sandbox transaction: **BLOCKED — merchant configuration/public IPN
  still required**. Browser fixtures and local tests do not count as real UAT.

## Cleanup

Removed unused Vite sample styles/icons, the old mock order hub and old confirmation
component. The order list now reads API data. No staff/POS, Lab or inventory workflow
was refactored in customer-web.
