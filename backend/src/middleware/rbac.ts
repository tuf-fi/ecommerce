import type { NextFunction, Request, Response } from "express";

type Role = NonNullable<Express.Request["staff"]>["role"];

// Must run after requireStaff.
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.staff) return res.status(401).json({ error: "Not signed in" });
    if (!roles.includes(req.staff.role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}
