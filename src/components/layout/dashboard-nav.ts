import {
  Calendar,
  CalendarClock,
  ClipboardCheck,
  DollarSign,
  FileClock,
  LayoutDashboard,
  ChartLine,
  Package,
  Scale,
  ReceiptText,
  Scissors,
  Settings,
  Shield,
  ShieldCheck,
  Landmark,
  Banknote,
  WalletCards,
  BookOpenCheck,
  UserCheck,
  SlidersHorizontal,
  Store,
  UserCog,
  Users,
  Wallet,
  MessageSquareWarning,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/services/auth/auth-utils";
import { rolesForPath, type ProtectedRoute } from "@/lib/route-access";
import { can, type Permission } from "@/lib/admin-permissions";

/**
 * The dashboard navigation: sidebar, drawer, bottom tabs and breadcrumb all
 * read this file. Who may see a link is not decided here - `rolesForPath`
 * reads it off the same table the route guards enforce, so a link is drawn
 * exactly when its destination would open.
 */
export type NavItem = {
  path: ProtectedRoute;
  icon: LucideIcon;
  label: string;
  /** Where the bottom tab goes, when it should open a filtered view. */
  tabHref?: string;
  /** Bottom-tab label, when `label` is too long for a fifth of a phone. */
  short?: string;
  labelByRole?: Partial<Record<UserRole, string>>;
  /** The admin permission the page checks; the link is hidden without it. */
  permission?: Permission;
  /** Shown only while this shell flag is on (e.g. four-eyes approvals). */
  onlyWhen?: keyof NavFlags;
  /** Roles the route admits but that should not get this link. */
  hiddenFor?: UserRole[];
};

export type NavGroup = { title?: string; items: NavItem[] };

/** Shell state some links depend on, from `GET /admin/me`. */
export type NavFlags = { approvals?: boolean };

// Admin items carry the permission their page checks, so an admin role that
// lacks it never sees the link. Each later admin phase adds its own items
// here when its page exists.
export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      {
        path: "/dashboard",
        icon: LayoutDashboard,
        label: "Dashboard",
        short: "Home",
        // They have their own home below; `/dashboard` redirects them there.
        hiddenFor: ["ADMIN", "AGENT"],
      },
    ],
  },
  {
    title: "Overview",
    items: [
      { path: "/dashboard/admin", icon: LayoutDashboard, label: "Home" },
      {
        path: "/dashboard/admin/analytics",
        icon: ChartLine,
        label: "Analytics",
        permission: "analytics.view",
      },
    ],
  },
  {
    title: "Salon",
    items: [
      {
        path: "/dashboard/appointments",
        icon: Calendar,
        label: "Appointments",
        short: "Bookings",
        labelByRole: { CUSTOMER: "My bookings" },
      },
      { path: "/dashboard/slots", icon: CalendarClock, label: "Slots" },
      { path: "/dashboard/services", icon: Package, label: "Services" },
      { path: "/dashboard/customers", icon: Users, label: "Customers" },
      { path: "/dashboard/store", icon: Store, label: "My salon" },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        path: "/dashboard/admin/salons",
        icon: ClipboardCheck,
        label: "Salons",
        permission: "salons.view",
        tabHref: "/dashboard/admin/salons?status=PENDING_APPROVAL",
      },
      {
        path: "/dashboard/admin/bookings",
        icon: CalendarClock,
        label: "Bookings",
        permission: "bookings.view",
      },
      {
        path: "/dashboard/admin/appeals",
        icon: Scale,
        label: "No-show appeals",
        short: "Appeals",
        permission: "appeals.resolve",
      },
      {
        path: "/dashboard/admin/applications",
        icon: Scissors,
        label: "Owner applications",
        short: "Applications",
        permission: "salons.review",
      },
      {
        path: "/dashboard/admin/users",
        icon: Users,
        label: "Users",
        permission: "users.view",
      },
      {
        path: "/dashboard/admin/agents",
        icon: UserCog,
        label: "Agents",
        permission: "agents.manage",
      },
    ],
  },
  {
    title: "Money",
    items: [
      { path: "/dashboard/wallet", icon: Wallet, label: "Wallet" },
      { path: "/dashboard/earnings", icon: DollarSign, label: "Earnings" },
      {
        path: "/dashboard/admin/finance",
        icon: Landmark,
        label: "Finance",
        permission: "finance.view",
      },
      {
        path: "/dashboard/admin/finance/payouts",
        icon: Banknote,
        label: "Payouts",
        permission: "finance.view",
      },
      {
        path: "/dashboard/admin/finance/wallets",
        icon: WalletCards,
        label: "Wallets",
        permission: "finance.view",
      },
      {
        path: "/dashboard/admin/finance/ledger",
        icon: BookOpenCheck,
        label: "Ledger",
        permission: "finance.view",
      },
      {
        path: "/dashboard/admin/finance/topups",
        icon: ReceiptText,
        label: "Top-ups & refunds",
        short: "Top-ups",
        permission: "finance.view",
      },
      {
        path: "/dashboard/admin/finance/approvals",
        icon: UserCheck,
        label: "Approvals",
        permission: "finance.view",
        onlyWhen: "approvals",
      },
    ],
  },
  {
    title: "Trust & support",
    items: [
      {
        path: "/dashboard/admin/reviews",
        icon: MessageSquareWarning,
        label: "Reviews",
        permission: "reviews.moderate",
      },
      {
        path: "/dashboard/admin/support",
        icon: LifeBuoy,
        label: "Support",
        permission: "support.view",
      },
    ],
  },
  {
    title: "Platform",
    items: [
      {
        path: "/dashboard/admin/team",
        icon: Shield,
        label: "Team",
        permission: "team.manage",
      },
      {
        path: "/dashboard/admin/settings",
        icon: SlidersHorizontal,
        label: "Platform settings",
        short: "Settings",
        permission: "settings.view",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        path: "/dashboard/applications-status",
        icon: FileClock,
        label: "Application status",
      },
      { path: "/dashboard/admin/security", icon: ShieldCheck, label: "My security" },
      { path: "/dashboard/settings", icon: Settings, label: "Settings" },
    ],
  },
];

/** The pages one tap away on a phone, in tab order. "More" is added after them. */
export const TABS_BY_ROLE: Record<UserRole, ProtectedRoute[]> = {
  CUSTOMER: ["/dashboard", "/dashboard/appointments", "/dashboard/wallet"],
  SALON_OWNER: ["/dashboard", "/dashboard/appointments", "/dashboard/slots", "/dashboard/services"],
  STAFF: ["/dashboard", "/dashboard/appointments", "/dashboard/customers"],
  ADMIN: [
    "/dashboard/admin",
    "/dashboard/admin/bookings",
    "/dashboard/admin/salons",
    "/dashboard/admin/support",
  ],
  AGENT: ["/dashboard/admin", "/dashboard/admin/salons"],
  GUEST: [],
};

export const labelFor = (item: NavItem, role: UserRole) =>
  item.labelByRole?.[role] ?? item.label;

/**
 * Role from the route table, then the admin permission when the item names
 * one. `permissions` is `GET /admin/me`'s list; without it (not an admin, or
 * the call failed) permissioned items stay hidden.
 */
const canSee = (
  item: NavItem,
  role: UserRole,
  permissions?: readonly string[],
  flags: NavFlags = {},
) =>
  !!rolesForPath(item.path)?.includes(role) &&
  !item.hiddenFor?.includes(role) &&
  (!item.permission || can(permissions, item.permission)) &&
  (!item.onlyWhen || !!flags[item.onlyWhen]);

/** The groups this role (and admin permission set) may see, with empty groups dropped. */
export const navGroupsFor = (
  role: UserRole,
  permissions?: readonly string[],
  flags?: NavFlags,
): NavGroup[] =>
  NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canSee(item, role, permissions, flags)),
  })).filter((group) => group.items.length > 0);

const ALL_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

export const tabsFor = (role: UserRole, permissions?: readonly string[]): NavItem[] =>
  TABS_BY_ROLE[role]
    .map((path) => ALL_ITEMS.find((item) => item.path === path))
    .filter((item): item is NavItem => !!item && canSee(item, role, permissions));

/** The item whose path is the longest prefix of the current one. */
export const activeItem = (pathname: string, items: NavItem[]) =>
  items
    .filter((i) => pathname === i.path || pathname.startsWith(`${i.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];

/** Pages below a nav item, named by their parent's path. */
const SUB_PAGES: Record<string, { crumb: string; title: string }> = {
  "/dashboard/store": { crumb: "Manage", title: "Manage salon" },
  "/dashboard/wallet": { crumb: "Payment", title: "Payment" },
  "/dashboard/admin/users": { crumb: "User", title: "User" },
  "/dashboard/admin/salons": { crumb: "Salon", title: "Salon" },
  "/dashboard/admin/bookings": { crumb: "Booking", title: "Booking" },
  "/dashboard/admin/support": { crumb: "Ticket", title: "Ticket" },
};

/** The nav items that are a role's home: the breadcrumb starts at them. */
const HOME_PATHS = new Set<string>(["/dashboard", "/dashboard/admin"]);

/** Pages in the dashboard frame that have no nav item. */
const OTHER_PAGES: Record<string, string> = { "/my-profile": "My profile" };

export type Crumb = { label: string; href?: string };

/**
 * The breadcrumb after "Dashboard" and the short title the phone top bar
 * shows. `/dashboard` itself has no trail.
 */
export const pageTrail = (
  pathname: string,
  items: NavItem[],
  role: UserRole,
): { trail: Crumb[]; title: string } => {
  const other = OTHER_PAGES[pathname];
  if (other) return { trail: [{ label: other }], title: other };

  const item = activeItem(pathname, items);
  if (!item || HOME_PATHS.has(item.path)) return { trail: [], title: "Dashboard" };

  const label = labelFor(item, role);
  const sub = pathname !== item.path ? SUB_PAGES[item.path] : undefined;
  if (!sub) return { trail: [{ label }], title: label };
  return {
    trail: [{ label, href: item.path }, { label: sub.crumb }],
    title: sub.title,
  };
};
