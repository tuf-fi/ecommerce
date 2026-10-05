import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { HttpError } from "../lib/httpError";

type Schemas = { body?: z.ZodType; params?: z.ZodType };

// Rejects a request with a 400 before the handler runs. A validated body replaces req.body, so unknown fields are
// stripped and numbers/strings have the types the schema says. (Query strings are parsed in the handlers that use them.)
export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    for (const part of ["params", "body"] as const) {
      const schema = schemas[part];
      if (!schema) continue;
      const parsed = schema.safeParse(req[part]);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        throw new HttpError(400, issue ? `${issue.path.join(".") || part}: ${issue.message}` : "Invalid request");
      }
      if (part === "body") req.body = parsed.data;
    }
    next();
  };
}

// Reusable parameter shapes.
export const orderNoParams = z.object({ no: z.string().regex(/^LM-\d{4,12}$/, "Invalid order number") });
export const proofParams = z.object({ no: z.string().regex(/^LM-\d{4,12}$/, "Invalid order number"), id: z.coerce.number().int().positive() });
export const uuidParams = z.object({ id: z.string().uuid("Invalid id") });
