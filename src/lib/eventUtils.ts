export interface EventLike {
  id?: string;
  date: string;
  endDate?: string | null;
  [key: string]: unknown;
}

export interface EventWindowStatus {
  isUpcoming: boolean;
  isActive: boolean;
  isPast: boolean;
}

export function getEventWindowStatus(event: EventLike, now: Date = new Date()): EventWindowStatus {
  const start = new Date(event.date);
  const end = event.endDate ? new Date(event.endDate) : start;

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return {
      isUpcoming: false,
      isActive: false,
      isPast: true,
    };
  }

  const isUpcoming = now < start;
  const isActive = now >= start && now <= end;
  const isPast = now > end;

  return {
    isUpcoming,
    isActive,
    isPast,
  };
}

export function getUpcomingEvents(events: EventLike[], now: Date = new Date()) {
  return events.filter((event) => {
    const { isUpcoming, isActive } = getEventWindowStatus(event, now);
    return isUpcoming || isActive;
  });
}
