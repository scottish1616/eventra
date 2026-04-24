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
  ticketTypes?: {
    price: number;
    name: string;
    category: string;
    totalSlots: number;
    soldCount: number;
  }[];
  orders?: { total: number }[];
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: "PAYMENT" | "TICKET" | "EVENT_ISSUE" | "OTHER";
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "ESCALATED";
  type: "ATTENDEE" | "ORGANIZER";
  complainantName: string;
  complainantPhone: string | null;
  complainantEmail: string | null;
  eventId: string | null;
  organizerId: string | null;
  resolvedBy: string | null;
  response: string | null;
  escalatedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  event?: { title: string; slug: string } | null;
  replies?: ComplaintReply[];
}

export interface ComplaintReply {
  id: string;
  complaintId: string;
  message: string;
  senderName: string;
  senderRole: string;
  createdAt: string;
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
  totalComplaints: number;
  pendingComplaints: number;
  escalatedComplaints: number;
}