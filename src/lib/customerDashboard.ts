export interface CustomerDashboardStatsInput {
  tickets: Array<{ isUsed?: boolean | null }>;
  reviews?: Array<unknown>;
  loyaltyPoints?: number | null;
}

export interface CustomerDashboardStats {
  totalTickets: number;
  attendedEvents: number;
  reviewCount: number;
  loyaltyPoints: number;
}

export function getCustomerDashboardStats(input: CustomerDashboardStatsInput): CustomerDashboardStats {
  const tickets = input.tickets ?? [];
  const reviews = input.reviews ?? [];

  return {
    totalTickets: tickets.length,
    attendedEvents: tickets.filter((ticket) => ticket.isUsed).length,
    reviewCount: reviews.length,
    loyaltyPoints: input.loyaltyPoints ?? 0,
  };
}
