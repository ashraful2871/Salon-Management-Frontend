export type UserRole = "CUSTOMER" | "STAFF" | "SALON_OWNER" | "ADMIN" | "AGENT" | "GUEST";

export const getDefaultDashboardRoute = (role: UserRole): string => {
  if (role === "ADMIN" || role === "AGENT") {
    return "/";
  }
  if (role === "SALON_OWNER") {
    return "/";
  }
  if (role === "CUSTOMER") {
    return "/";
  }
  if (role === "STAFF") {
    return "/";
  }
  return "/";
};
