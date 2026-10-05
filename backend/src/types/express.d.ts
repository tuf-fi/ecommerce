declare namespace Express {
  interface Request {
    customerId?: number;
    staff?: { id: number; email: string; name: string; role: "ADMINISTRATOR" | "STAFF"; access: string; twoFactorEnabled: boolean };
    // The AdminSession this request is authenticated with (set by requireStaff).
    sessionId?: string;
  }
}
