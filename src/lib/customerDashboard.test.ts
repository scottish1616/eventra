import test from "node:test";
import assert from "node:assert/strict";
import { getCustomerDashboardStats } from "./customerDashboard";

test("builds dashboard stats from ticket and review data", () => {
  const stats = getCustomerDashboardStats({
    tickets: [
      { isUsed: false },
      { isUsed: true },
      { isUsed: true },
    ],
    reviews: [{}, {}],
    loyaltyPoints: 120,
  });

  assert.equal(stats.totalTickets, 3);
  assert.equal(stats.attendedEvents, 2);
  assert.equal(stats.reviewCount, 2);
  assert.equal(stats.loyaltyPoints, 120);
});
