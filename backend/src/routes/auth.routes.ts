import { Router } from "express";
import { requireCustomer, requireStaff } from "../middleware/auth";
import { validate, uuidParams } from "../middleware/validate";
import {
  adminLoginLimiter,
  loginByIpLimiter,
  loginLimiter,
  otpRequestLimiter,
  otpVerifyLimiter,
  registerLimiter,
  twoFactorLimiter,
  accountSecurityLimiter,
} from "../middleware/rateLimit";
import * as auth from "../controllers/auth.controller";
import * as security from "../controllers/adminSecurity.controller";

export const authRouter = Router();

authRouter.post("/customer/register", registerLimiter, auth.customerRegister);
authRouter.post("/customer/login", loginByIpLimiter, loginLimiter, auth.customerLogin);
authRouter.post("/customer/logout", auth.customerLogout);
authRouter.get("/customer/session", requireCustomer, auth.customerSession);
authRouter.patch("/customer/profile", requireCustomer, auth.customerUpdateProfile);
authRouter.post("/customer/password", requireCustomer, accountSecurityLimiter, auth.customerChangePassword);
authRouter.post("/customer/otp/request", otpRequestLimiter, auth.otpRequest);
authRouter.post("/customer/otp/verify", otpVerifyLimiter, auth.otpVerify);

authRouter.post("/admin/login", loginByIpLimiter, adminLoginLimiter, auth.adminLogin);
authRouter.post("/admin/login/2fa", twoFactorLimiter, validate({ body: security.twoFactorLoginSchema }), security.twoFactorLogin);
authRouter.post("/admin/logout", auth.adminLogout);
authRouter.get("/admin/session", requireStaff, auth.adminSession);

authRouter.get("/admin/sessions", requireStaff, security.listSessions);
authRouter.post("/admin/sessions/revoke-others", requireStaff, security.revokeOtherSessions);
authRouter.delete("/admin/sessions/:id", requireStaff, validate({ params: uuidParams }), security.revokeSession);

authRouter.post("/admin/password", requireStaff, accountSecurityLimiter, validate({ body: security.changePasswordSchema }), security.changePassword);
authRouter.post("/admin/2fa/setup", requireStaff, security.twoFactorSetup);
authRouter.post("/admin/2fa/enable", requireStaff, accountSecurityLimiter, validate({ body: security.enableTwoFactorSchema }), security.twoFactorEnable);
authRouter.post("/admin/2fa/disable", requireStaff, accountSecurityLimiter, validate({ body: security.disableTwoFactorSchema }), security.twoFactorDisable);
