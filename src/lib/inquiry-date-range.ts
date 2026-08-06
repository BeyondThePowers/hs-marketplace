export type InquiryDateConstraints = {
  startMin: string;
  startMax: string | null;
  endMin: string;
  endMax: string | null;
};

export function shiftIsoDate(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function hasStrictDateOrder(start: string, end: string): boolean {
  return Boolean(start && end && end > start);
}

export function inquiryDateConstraints(input: {
  today: string;
  start?: string;
  end?: string;
  calendarMaximum?: string | null;
}): InquiryDateConstraints {
  const { today, start = '', end = '', calendarMaximum = null } = input;
  const calendarStartMaximum = calendarMaximum ? shiftIsoDate(calendarMaximum, -1) : null;
  const startMaximumFromEnd = end ? shiftIsoDate(end, -1) : null;
  const startMax = startMaximumFromEnd && calendarStartMaximum
    ? (startMaximumFromEnd < calendarStartMaximum ? startMaximumFromEnd : calendarStartMaximum)
    : startMaximumFromEnd || calendarStartMaximum;

  return {
    startMin: today,
    startMax,
    endMin: start ? shiftIsoDate(start, 1) : shiftIsoDate(today, 1),
    endMax: calendarMaximum,
  };
}
