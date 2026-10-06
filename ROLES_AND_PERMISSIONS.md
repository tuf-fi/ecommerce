# Roles and Permissions

Who can do what on Cindyrella: administrators, staff and customers. The server enforces everything below (a blocked action is refused even if someone calls it directly); the menus and buttons simply match, so people aren't shown things they can't use.

There are three kinds of people:

- **Administrator** — can do everything in the admin panel (section 2).
- **Staff** — use the admin panel, limited by an **access level** that an administrator picks on the Staff page (section 3).
- **Customers** — shoppers on the public website; visitors who haven't signed in have even fewer abilities (section 5). They never see the admin panel.

---

## 1. At a glance (admin panel)

| What | Administrator | Full access | Inventory & orders only | Inventory only | Orders only |
|---|:-:|:-:|:-:|:-:|:-:|
| See the Dashboard | yes | yes | yes | yes | yes |
| Change own password, two-factor, sign out own devices | yes | yes | yes | yes | yes |
| Add / edit / delete products, change stock | yes | yes | yes | yes | – |
| Import and export products (CSV), stock movement log | yes | yes | yes | yes | – |
| View orders, change order status | yes | yes | yes | – | yes |
| Approve / reject payment screenshots | yes | yes | yes | – | yes |
| Export orders, import order status updates (CSV) | yes | yes | yes | – | yes |
| Edit website content (text, images, pages, journal, promotions) | yes | yes | – | – | – |
| See the customer list, newsletter subscribers and Contact-form messages | yes | yes | – | – | – |
| **Change Payment Details** (the accounts customers pay into) | **yes** | – | – | – | – |
| **Staff page** (add, edit, deactivate, delete accounts) | **yes** | – | – | – | – |
| **Audit log** (who changed what) | **yes** | – | – | – | – |
| **Discount codes** (create, turn on/off) | **yes** | – | – | – | – |
| **Shipping fee** (Payment Details page) | **yes** | – | – | – | – |
| **Record a refund** on a paid order | **yes** | – | – | – | – |

There is no "Custom" level any more. An account that still holds an unrecognised access value gets nothing beyond the Dashboard and the person's own settings until an administrator picks one of the four levels.

---

## 2. Administrators

An administrator can do **everything** in the table above: every inventory, orders and content action, the customer list, and the three things nobody else can touch.

### Only administrators can

| Area | What |
|---|---|
| **Staff page** | See all staff accounts; add a person (name, email, role, access level, starting password); change their name, email, role, access level or photo; deactivate or reactivate them; set a new password for them; turn off their two-factor when they lose their phone and recovery codes; delete them |
| **Payment Details** | Change the GCash / Maya / bank accounts and message that customers see when they pay. Every change is logged with the account numbers, so a swapped number can always be traced |
| **Audit log** | Audit Log (System section of the sidebar): read the record of who changed what (orders, products, staff accounts, discount codes, site content), newest first, filtered by type or id |
| **Discount codes** | Discount Codes (Sales section): create percentage-off codes (optional last day and total-use limit) and turn them on or off |
| **Shipping** | Set the flat shipping fee and an optional free-shipping amount (Payment Details → Shipping). Until it is set, shipping is free |
| **Refunds** | Record that a paid order was refunded (amount and note, once per order, never more than the total). It doesn't move any money: you send it back yourself; the customer is emailed |

### Safeguards, which apply to administrators too

- You **can't delete, deactivate or demote yourself**, and you can't change your own access level. (You can still change your own name, photo, password and two-factor.) Ask another administrator.
- The **last active administrator** can't be demoted, deactivated or deleted, so the panel can never lock everyone out. This holds even if two administrators try to remove each other at the same moment.
- Changing someone's role, access, email or password, or deactivating them, **signs them out everywhere** straight away.
- Every change to a staff account is written to the audit log (never including passwords).

### What nobody can do, administrators included

- Read anyone's password: passwords are stored only as one-way hashes.
- Edit or delete audit-log entries or an order's history: the database refuses it, so the record can't be rewritten.
- Move a **Delivered** or **Cancelled** order to another status, or make a Pending order skip steps (for example straight to Delivered). The allowed moves are Pending → Paid / Cancelled, Paid → Shipped / Cancelled, Shipped → Delivered.
- Create an order from a spreadsheet. Orders only come from customers checking out.
- End another person's session directly. An administrator signs someone out by editing or deactivating their account.

---

## 3. Staff, by access level

| Access level | Inventory | Orders | Site content | Customer list |
|---|---|---|---|---|
| **Full access** | yes | yes | yes | yes (and subscribers, messages) |
| **Inventory & orders only** | yes | yes | no | no |
| **Inventory only** | yes | no | no | no |
| **Orders only** | no | yes | no | no |

### What each area includes

- **Inventory:** view, add, edit and delete products and sizes; change stock (every change needs a reason); the stock movement log; **import and export products as CSV** (Inventory page → Import / Export). Import adds new products from a CSV with the columns Product name, SKU, Category, Price Min and Stock (rows with an existing SKU or bad values are skipped and reported).
- **Orders:**
  - View and search orders, see an order's history.
  - Change an order's status (allowed moves only; cancelling returns the items to stock).
  - **Approve or reject payment screenshots** and view the screenshots. Approving marks the order Paid.
  - **Export orders** as a CSV and **import order status updates** from a CSV (section 4).
- **Site content:** edit the website text, images, pages, journal, promotions and so on. (Not the payment details; those are administrators only.)
- **Customer list, subscribers and messages:** registered customers' names, emails and join dates; the newsletter subscriber list; messages sent from the Contact form (Customers section of the sidebar).

### What every signed-in staff member can always do

- See the **Dashboard**. Its charts and counts only include what their access lets them see.
- Change **their own** password, set up **their own** two-factor, and view or sign out **their own** devices (Settings → Password & Authentication / Active Sessions).
- See the notification bell, limited to their areas: new orders and payments to review (Orders access), low or out-of-stock products (Inventory access).

---

## 4. Importing and exporting orders (administrators and anyone with Orders access)

**Export** (Orders page → Export): downloads every order as a spreadsheet, or only the status you have filtered to. Columns: Order, Date, Customer, Email, Address, Items, Item count, Subtotal, Discount, Voucher code, Shipping, Total, Status, Payment method, Paid on, Refunded. Customer-typed text that begins with `=`, `+`, `-` or `@` is prefixed with an apostrophe so it can't run as a formula when opened in Excel. The older "Export CSV" in the bulk bar still exports just the rows you ticked.

**Import** (Orders page → Import): updates the **status** of many orders at once, for example from a courier's sheet. The file needs two columns, `Order` and `Status`. You can export, change the Status column, and import that file back. Rules:
- Each row follows exactly the same rules as changing a status by hand: allowed moves only, cancelling returns stock, and every change appears in the order's history as "Status import" with the person's name.
- A row that can't be applied is skipped and reported (unknown order, unknown status, not allowed from the current status, already that status); the rest still go through.
- Up to 500 rows per file, 1 MB.

---

## 5. Customers and visitors

Shoppers use the public website, not the admin panel. A customer account is **completely separate** from a staff account: different sign-in page, different login cookie, and the same email address can exist as both without being linked. A customer can never open the admin panel or call its functions, whatever they type into the address bar.

### Visitors (not signed in) can

- Browse the shop, product pages, reviews, rituals, the journal and the other pages, and see prices and stock levels.
- Fill a bag and a wishlist. Both are saved only in that browser until they sign in; at sign-in the wishlist is merged into their account.
- Check that the items in a bag are in stock and see current prices (no account needed).
- Create an account, sign in, and reset a forgotten password with a 6-digit code sent by email (code lasts 10 minutes, 5 wrong tries and it's void).
- Subscribe to the newsletter, send a message through the Contact form, and claim the welcome code (one per email address).

Visitors **can't** place an order, write a review, or see any account page. Trying to check out opens the sign-in box.

### Signed-in customers can

| Area | What they can do |
|---|---|
| **Orders** | Place an order (the server works out the prices and takes the stock; nothing the browser sends about prices is trusted). See **their own** orders and each order's progress. **Cancel an order only while it is still unpaid** and no payment screenshot is waiting to be checked |
| **Paying** | See the shop's payment details and total, and **upload a screenshot** of their transfer for an unpaid order (JPG, PNG or WEBP, up to 3 MB; one waiting at a time; up to 5 attempts per order). View their own screenshots. If one is rejected they see the reason and can upload another |
| **Reviews** | Write one review per product (they don't have to have bought it). It appears straight away under "First L." |
| **Account** | Change their name and profile photo, and change their password (they must enter the current one) |
| **Delivery addresses** | Add, edit and remove addresses (up to 10) and pick one for checkout. Saved on their account, so they appear on any device |
| **Wishlist** | Saved on their account and available on any device |
| **Discount codes** | Type a code in the cart; the server applies it and shows the discount. Each customer can use a given code once. They can also see their own unused, unexpired welcome codes under My Vouchers |
| **Shipping** | See the shipping fee in the cart before ordering (free if the shop hasn't set one, or the order is over the free-shipping amount) |
| **Emails** | Receive emails when an order is placed, changes status or is refunded, and a one-click unsubscribe link in newsletters and promotions (order emails aren't affected) |
| **Sign-in** | Email and password, or Google (when the shop has set it up). "Sign out of all devices" on Change Password ends every login on every device |

### Customers can't

- See, change or cancel anyone else's order, screenshot, review or account.
- Cancel an order once payment has been verified or the order has shipped. They contact the shop, and staff handle it.
- Change an order's status, approve a payment, or see other customers or any staff-only information.
- Edit or delete a review after posting it, change their email address, or delete their account. These features don't exist yet.
- Reopen a cancelled order. Unpaid orders are cancelled automatically after 24 hours (unless a screenshot is waiting for review) and the items go back on sale; they place a new order.

### Safeguards on customer accounts

- Wrong-password sign-ins are limited (10 failed tries per 15 minutes for one account), as are sign-ups, password-reset codes, public forms and checkout requests, so scripts can't hammer the shop.
- Sign-in and password-reset messages don't reveal whether an email has an account (sign-up does say if an email is already taken).
- Payment screenshots are private: only the customer who uploaded one and signed-in staff with Orders access can view it.

---

## 6. How the admin menus behave

- Sidebar and settings-menu links to pages the account can't use are **hidden**. For example "Payment Details" and "Staff & Roles" only appear for administrators.
- On the Dashboard, tiles, "View all" buttons and chart clicks that would lead to a page the account can't use are removed or turned off.
- If someone types or bookmarks a page they can't use, they are sent back to the Dashboard with a message.

---

## 7. What is **not** limited (worth knowing)

Access levels decide *areas*, not *amounts*. For example:
- Anyone with Inventory access can delete products and change any stock number.
- Anyone with Orders access can approve payments, mark orders Paid, and cancel orders, whatever the amount.
- Anyone with Full access can change any website content.
- Nothing requires a second person to approve a large payment. A possible safeguard is described in `NEXT_STEPS.md` (C7, item 5).

Because screenshots are easy to fake, whoever approves payments should confirm the money arrived in the real GCash / bank account first.

---

## 8. Adding people and changing access

- **Admin panel:** Staff page (administrators only) → add a person with a role, access level and starting password; edit them later; untick "Account is active" to lock someone out without deleting their history.
- **First administrator / emergency:** `npm run create-staff -- <email> <password> "<name>" ADMINISTRATOR` in `backend/` (it also resets that person's password if they already exist).
- **Where the rules live (for developers):** the access table is `backend/src/lib/sections.ts` (server) and `frontend/library/admin/permissions.ts` (menus and page guard); keep the two in step. Routes are protected in `backend/src/routes/*.routes.ts` with `requireSection(...)` and `requireRole("ADMINISTRATOR")`.
