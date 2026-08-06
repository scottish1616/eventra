import test from "node:test";
import assert from "node:assert/strict";
import { getEventWindowStatus, getUpcomingEvents } from "./eventUtils";

test("counts active events using their end date instead of only the start date", () => {
  const now = new Date("2026-08-06T12:00:00.000Z");

  const events = [
    {
      id: "1",
      date: "2026-08-06T10:00:00.000Z",
      endDate: "2026-08-06T16:00:00.000Z",
    },
    {
      id: "2",
      date: "2026-08-06T18:00:00.000Z",
      endDate: "2026-08-06T20:00:00.000Z",
    },
    {
      id: "3",
      date: "2026-08-05T10:00:00.000Z",
      endDate: "2026-08-05T12:00:00.000Z",
    },
  ];

  const upcoming = getUpcomingEvents(events, now);

  assert.deepEqual(upcoming.map((event) => event.id), ["1", "2"]);
  assert.equal(getEventWindowStatus(events[0], now).isActive, true);
  assert.equal(getEventWindowStatus(events[2], now).isActive, false);
});
