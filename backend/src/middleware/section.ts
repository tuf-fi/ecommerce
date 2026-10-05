import type { NextFunction, Request, Response } from "express";
import { canAccess, type Section } from "../lib/sections";

// Must run after requireStaff. Enforces on the server what the admin menu only hides.
export function requireSection(section: Section) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.staff) return res.status(401).json({ error: "Not signed in" });
    if (!canAccess(req.staff, section)) return res.status(403).json({ error: "Your account doesn't have access to this area" });
    next();
  };
}
