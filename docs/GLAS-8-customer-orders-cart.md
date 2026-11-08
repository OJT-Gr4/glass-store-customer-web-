# GLAS-8: Customer orders and account-scoped cart

Owner: Tran Huu Trung Phong. Plan: S3-08, 5 story points.

## Behavior

- Order history uses `GET /api/orders/customer/{customerId}` with the customer bearer token. Eight orders are displayed per page, with a status filter and explicit loading, empty and error states.
- A selected order uses `GET /api/orders/{id}`. The `#orders/{id}` URL survives refresh. No sample order, payment confirmation or Lab progress is inserted when an API fails.
- Cancellation sends a reason to `POST /api/orders/{id}/cancel-request`. Only a matching response in `CANCEL_REQUESTED` changes the screen. This is a request awaiting staff approval, not a completed cancellation or refund.
- Cart lines, quantities and customer-provided measurements persist in a versioned localStorage key for each account. Guest selections are merged on login, then removed from the guest key after a successful save. Incompatible prescriptions or stock limits preserve the guest cart and display an explanation.
- Logout/account changes close checkout and invalidate its in-memory request reference. Late responses cannot navigate another customer's session or clear that customer's cart.
- Local storage is per browser/device. This change does not synchronize carts between devices. Prices, stock and authorization are checked by existing server contracts at checkout.

## Files

- [Application integration](../src/App.jsx)
- [Orders API](../src/api/customerOrdersApi.js)
- [Order history](../src/components/OrdersPage.jsx)
- [Order detail and cancellation](../src/components/OrderDetailHubPage.jsx)
- [Persistent cart store](../src/components/customerCartStore.js)

## Verification

Run `npm test` and `npm run build` in customer-web. New tests cover authenticated order reads, wrong-owner response rejection, failed/incomplete cancellation responses, account separation, reload restoration, guest claiming and storage failures.

The existing backend `OrderAccessSecurityTest` checks real Spring security/persistence with an isolated H2 database: customer A cannot read customer B's orders through IDs, codes, customer lists or payments, and spoofed customer headers do not change ownership. This is a focused automated check; live MySQL/browser acceptance remains part of the team's next integration pass.
