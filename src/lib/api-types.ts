export type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errorDetails?: Record<string, string[]>;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
};

export type OperatingHour = {
  open: string;
  close: string;
};

export type OperatingHours = Partial<
  Record<
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday",
    OperatingHour
  >
>;

export type SalonStatus = "ACTIVE" | "INACTIVE" | "PENDING";

export type Salon = {
  id: string;
  name: string;
  description?: string | null;
  phone?: string;
  email?: string;
  website?: string;
  address?: string | null;
  division?: string;
  district?: string;
  area?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  images?: string[];
  operatingHours?: OperatingHours;
  status?: SalonStatus;
  rating?: number;
  totalReviews?: number;
  services?: SalonService[];
  staff?: StaffMember[];
  reviews?: Review[];
  _count?: {
    services: number;
    staff: number;
    reviews: number;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type SalonService = {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  price?: number | null;
  duration?: number | null;
  images?: string[];
  isActive?: boolean;
  salonId?: string;
  salon?: { name: string };
  createdAt?: string;
  updatedAt?: string;
};

export type StaffMember = {
  id: string;
  speciality?: string;
  experience?: number;
  bio?: string;
  status?: "AVAILABLE" | "BUSY" | "OFF";
  designation?: string;
  salonId?: string;
  user?: {
    name: string;
    email: string;
    profilePhoto?: string;
  };
};

export type Appointment = {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime?: string;
  status: AppointmentStatus;
  notes?: string;
  customer?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  service?: {
    id: string;
    name: string;
    duration?: number;
    price?: number;
  };
  salon?: {
    id: string;
    name: string;
  };
  staff?: {
    id: string;
    user?: { name: string };
  };
  counter?: {
    name: string;
  };
  review?: unknown;
  createdAt?: string;
  updatedAt?: string;
};

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type User = {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  gender?: string;
  role: string;
  status?: string;
  profilePhoto?: string;
  createdAt?: string;
};

export type Review = {
  id: string;
  rating: number;
  comment?: string;
  user?: { name: string };
  createdAt?: string;
};

export type DashboardStats = {
  totalUsers?: number;
  totalSalons?: number;
  totalAppointments?: number;
  totalRevenue?: number;
  todayAppointments?: number;
  pendingAppointments?: number;
  completedAppointments?: number;
  upcomingAppointments?: number;
  totalSpent?: number;
  recentAppointments?: Appointment[];
  appointmentsByStatus?: Array<{
    status: string;
    _count: number;
  }>;
};

export type SalonApplication = {
  id: string;
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  documentUrl?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  user?: { name: string; email: string };
  createdAt?: string;
};

export type ApplicationStatusType = "PENDING" | "APPROVED" | "REJECTED";

export type ApplicationData = {
  id: string;
  userId: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  verificationStatus: boolean;
  documentUrl: string;
  applicationStatus: ApplicationStatusType;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

export type SalonQuery = {
  division?: string;
  district?: string;
  area?: string;
  searchTerm?: string;
  city?: string;
};
