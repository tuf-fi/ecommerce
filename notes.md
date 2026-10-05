# Notes

## Admin dashboard — panel sequence

Current order is kept as-is: **urgency before analysis**.

1. Performance row (Revenue / Orders / New Users) — today's headline numbers
2. Needs Attention — summary of what requires action
3. Recent Orders + Inventory Alerts — the actionable detail behind that summary (which orders, which SKUs)
4. Sales Trend + Stock Health — lower-urgency analytical context
5. Top Selling Products — informational ranking, least time-sensitive

That's a clean "do this now → here's why → nice to know" scan, and it matches the dashboard's own in-code rationale (it was deliberately reordered once already to put action-needed content before trend/ranking charts).

Considered and rejected: regrouping by domain instead — pairing Inventory Alerts with Stock Health, and Recent Orders with Sales Trend. That would interleave "go do something" and "just look at this" content twice instead of once, which is worse for a fast morning scan, not better.

No changes applied.
