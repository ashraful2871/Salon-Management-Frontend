export type UserRole = "CUSTOMER" | "STAFF" | "SALON_OWNER" | "ADMIN";

export const getDefaultDashboardRoute = (role: UserRole): string => {
  if (role === "ADMIN") {
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
