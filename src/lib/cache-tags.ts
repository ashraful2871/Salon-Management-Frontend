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
} as const;
