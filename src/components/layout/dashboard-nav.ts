import {
  Calendar,
  CalendarClock,
  ClipboardCheck,
  DollarSign,
  FileClock,
  LayoutDashboard,
  Package,
  ReceiptText,
  Scissors,
  Settings,
  Store,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/services/auth/auth-utils";
import { rolesForPath, type ProtectedRoute } from "@/lib/route-access";

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
  /** Bottom-tab label, when `label` is too long for a fifth of a phone. */
  short?: string;
  labelByRole?: Partial<Record<UserRole, string>>;
};

export type NavGroup = { title?: string; items: NavItem[] };

// `/dashboard/admin` has no page of its own, so it gets no link; its
// ROUTE_ROLES entry still guards the subtree.
export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", short: "Home" },
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
      {
        path: "/dashboard/customers",
        icon: Users,
        label: "Customers",
        labelByRole: { ADMIN: "Users", AGENT: "Users" },
      },
      { path: "/dashboard/store", icon: Store, label: "My salon" },
    ],
  },
  {
    title: "Money",
    items: [
      { path: "/dashboard/wallet", icon: Wallet, label: "Wallet" },
      { path: "/dashboard/earnings", icon: DollarSign, label: "Earnings" },
      {
        path: "/dashboard/admin/topups",
        icon: ReceiptText,
        label: "Top-ups & refunds",
        short: "Top-ups",
      },
    ],
  },
  {
    title: "Admin",
    items: [
      {
        path: "/dashboard/approval-salon",
        icon: ClipboardCheck,
        label: "Salon approvals",
        short: "Approvals",
      },
      {
        path: "/dashboard/become-a-salon-owner-request",
        icon: Scissors,
        label: "Owner requests",
      },
      { path: "/dashboard/admin/agents", icon: UserCog, label: "Agents" },
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
      { path: "/dashboard/settings", icon: Settings, label: "Settings" },
    ],
  },
];

/** The pages one tap away on a phone, in tab order. "More" is added after them. */
export const TABS_BY_ROLE: Record<UserRole, ProtectedRoute[]> = {
  CUSTOMER: ["/dashboard", "/dashboard/appointments", "/dashboard/wallet"],
  SALON_OWNER: ["/dashboard", "/dashboard/appointments", "/dashboard/slots", "/dashboard/services"],
  STAFF: ["/dashboard", "/dashboard/appointments", "/dashboard/customers"],
  ADMIN: ["/dashboard", "/dashboard/approval-salon", "/dashboard/admin/topups", "/dashboard/customers"],
  AGENT: ["/dashboard", "/dashboard/approval-salon", "/dashboard/customers"],
  GUEST: [],
};

export const labelFor = (item: NavItem, role: UserRole) =>
  item.labelByRole?.[role] ?? item.label;

const canSee = (item: NavItem, role: UserRole) =>
  !!rolesForPath(item.path)?.includes(role);

/** The groups this role may see, with empty groups dropped. */
export const navGroupsFor = (role: UserRole): NavGroup[] =>
  NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canSee(item, role)),
  })).filter((group) => group.items.length > 0);

const ALL_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

export const tabsFor = (role: UserRole): NavItem[] =>
  TABS_BY_ROLE[role]
    .map((path) => ALL_ITEMS.find((item) => item.path === path))
    .filter((item): item is NavItem => !!item && canSee(item, role));

/** The item whose path is the longest prefix of the current one. */
export const activeItem = (pathname: string, items: NavItem[]) =>
  items
    .filter((i) => pathname === i.path || pathname.startsWith(`${i.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];

/** Pages below a nav item, named by their parent's path. */
const SUB_PAGES: Record<string, { crumb: string; title: string }> = {
  "/dashboard/store": { crumb: "Manage", title: "Manage salon" },
  "/dashboard/wallet": { crumb: "Payment", title: "Payment" },
};

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
  if (!item || item.path === "/dashboard") return { trail: [], title: "Dashboard" };

  const label = labelFor(item, role);
  const sub = pathname !== item.path ? SUB_PAGES[item.path] : undefined;
  if (!sub) return { trail: [{ label }], title: label };
  return {
    trail: [{ label, href: item.path }, { label: sub.crumb }],
    title: sub.title,
  };
};
