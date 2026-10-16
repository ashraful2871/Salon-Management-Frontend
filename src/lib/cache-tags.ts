// Every cache tag the services use. A read declares some of these in
// `next.tags`; a mutation calls `updateTag` for the ones on screen for the user
// who acted and `revalidateTag(tag, "max")` for the rest. Keeping them here is
// what lets a mutation find the tags its reads declared.
export const TAGS = {
  salons: "salons",
  salon: (id: string) => `salon-${id}`,
  mySalons: "my-salons",
  appointments: "appointments",
  myAppointments: "my-appointments",
  dashboardStats: "dashboard-stats",
  services: "services",
  myServices: "my-services",
  slots: "slots",
  staff: (salonId: string) => `staff-${salonId}`,
  users: "users",
  myCustomers: "my-customers",
  salonApplications: "salon-applications",
  applicationsStatus: "applications-status",
  earnings: "earnings",
  adminTopups: "admin-topups",
  me: "me",
  assistantStatus: "assistant-status",
  authProviders: "auth-providers",
  reviews: "reviews",
  hairstyles: "hairstyles",
  ownerAccess: "owner-access",
  payoutAccounts: "payout-accounts",
  ownerMoney: "owner-money",
  ownerPayouts: "owner-payouts",
  ownerStatements: "owner-statements",
  /** Owner Customer 360 (list, profile, notes). */
  ownerCustomers: "owner-customers",
  /** Owner Reviews page (list + summary). */
  ownerReviews: "owner-reviews",
  /** Owner Home (`GET /owner/home`): one per branch key ("all" or a salon id) plus the shared base every booking mutation expires. */
  ownerHome: (key: string) => `owner-home-${key}`,
  ownerHomes: "owner-home",
  /** Team page: a branch's members and its pending invitations. */
  salonMembers: (salonId: string) => `salon-members-${salonId}`,
  salonInvitations: (salonId: string) => `salon-invitations-${salonId}`,
  /** A stylist's working hours and time off, plus the base every schedule write expires (the calendar reads it). */
  staffSchedule: (staffId: string) => `staff-schedule-${staffId}`,
  staffSchedules: "staff-schedules",
  /** A branch's holidays and special hours (`GET /salons/:id/closures`). */
  salonClosures: (salonId: string) => `salon-closures-${salonId}`,
  /** A branch's online-booking pause as its owner sees it (`GET /salons/:id/pause`). */
  salonPause: (salonId: string) => `salon-pause-${salonId}`,
  /** Profile completeness per branch (`GET /owner/salons/completeness`). */
  salonCompleteness: "salon-completeness",
  /** Owner Reports (`GET /owner/reports/:report`); every report shares it. */
  ownerReports: "owner-reports",
  /** Team → Performance (`GET /owner/team/performance`). */
  teamPerformance: "team-performance",
  /** The bell and the full list (`GET /owner/notifications`); per user. */
  notifications: "notifications",
  /** Settings → Notifications (`GET /owner/notification-prefs`). */
  notificationPrefs: "notification-prefs",
  /** Activity (`GET /owner/activity`) over the audit log. */
  ownerActivity: "owner-activity",
  // Back office (`/admin/*`).
  adminMe: "admin-me",
  adminInbox: "admin-inbox",
  adminUsers: "admin-users",
  adminUser: (id: string) => `admin-user-${id}`,
  adminSalons: "admin-salons",
  adminSalon: (id: string) => `admin-salon-${id}`,
  adminBookings: "admin-bookings",
  adminBooking: (id: string) => `admin-booking-${id}`,
  adminAppeals: "admin-appeals",
  adminPayouts: "admin-payouts",
  adminFinance: "admin-finance",
  adminPayoutAccounts: "admin-payout-accounts",
  adminApprovals: "admin-approvals",
  adminWallets: "admin-wallets",
  adminDues: "admin-dues",
  adminLedger: "admin-ledger",
  adminReviews: "admin-reviews",
  adminTickets: "admin-tickets",
  adminTicket: (id: string) => `admin-ticket-${id}`,
  adminSettings: "admin-settings",
  publicSettings: "public-settings",
  adminAudit: "admin-audit",
  adminTeam: "admin-team",
  adminAgents: "admin-agents",
  /** Places that have a salon, for the agent area picker. */
  adminAreas: "admin-areas",
  adminAnalytics: "admin-analytics",
  adminSystem: "admin-system",
} as const;
