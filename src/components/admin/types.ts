export interface Organizer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  organizationName: string | null;
  createdAt: string;
  subscriptionStatus: "active" | "pending" | "inactive" | "paused";
}

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  status: string;
  slug: string;
  organizer: { name: string; organizationName: string | null } | null;
  _count: { tickets: number };
}

export interface PlatformStats {
  totalRevenue: number;
  subscriptionRevenue: number;
  totalEvents: number;
  publishedEvents: number;
  totalTickets: number;
  totalOrganizers: number;
  activeOrganizers: number;
  pendingOrganizers: number;
}

export interface ChartDataPoint {
  month: string;
  events: number;
  organizers: number;
  tickets: number;
  revenue: number;
}