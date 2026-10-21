// Where staff sign in. Deliberately not under /admin: visitors who type /admin get a plain "not found" and never see a
// login form. Set NEXT_PUBLIC_ADMIN_LOGIN_PATH to something only your team knows (it must start with "/").
export const ADMIN_LOGIN_PATH = process.env.NEXT_PUBLIC_ADMIN_LOGIN_PATH ?? "/staff-access";
