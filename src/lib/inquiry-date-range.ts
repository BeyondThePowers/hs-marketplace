export type InquiryDateConstraints = {
  startMin: string;
  startMax: string | null;
  endMin: string;
  endMax: string | null;
};

export type InquiryAvailabilityRules = {
  years: Array<{ year: number; mode: 'allow' | 'block' }>;
  dates: string[];
};

export function isInquiryDateAvailable(
  date: string,
  rules: InquiryAvailabilityRules | null,
  today: string,
): boolean {
  if (!date || date < today) return false;
  if (!rules) return true;
  const yearRule = rules.years.find((item) => item.year === Number(date.slice(0, 4)));
  if (!yearRule) return false;
  const listed = rules.dates.includes(date);
  return yearRule.mode === 'allow' ? listed : !listed;
}

export function isInquiryRangeAvailable(
  start: string,
  end: string,
  rules: InquiryAvailabilityRules | null,
  today: string,
): boolean {
  if (!hasStrictDateOrder(start, end)) return false;
  let current = start;
  while (current <= end) {
    if (!isInquiryDateAvailable(current, rules, today)) return false;
    current = shiftIsoDate(current, 1);
  }
  return true;
}

export function shiftIsoDate(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function hasStrictDateOrder(start: string, end: string): boolean {
  return Boolean(start && end && end > start);
}

export function inquiryCalendarBounds(
  rules: InquiryAvailabilityRules,
  today: string,
): { minimum: string; maximum: string } | null {
  if (rules.years.length === 0) return null;
  const listedDates = new Set(rules.dates);
  const years = [...rules.years].sort((left, right) => left.year - right.year);
  const firstConfiguredDate = `${years[0].year}-01-01`;
  const lastConfiguredDate = `${years[years.length - 1].year}-12-31`;
  let current = today > firstConfiguredDate ? today : firstConfiguredDate;
  let minimum: string | null = null;
  let maximum: string | null = null;

  while (current <= lastConfiguredDate) {
    const rule = years.find((item) => item.year === Number(current.slice(0, 4)));
    const listed = listedDates.has(current);
    const available = rule ? (rule.mode === 'allow' ? listed : !listed) : false;
    if (available) {
      minimum ??= current;
      maximum = current;
    }
    current = shiftIsoDate(current, 1);
  }

  return minimum && maximum ? { minimum, maximum } : null;
}

export function inquiryDateConstraints(input: {
  today: string;
  start?: string;
  end?: string;
  calendarMinimum?: string | null;
  calendarMaximum?: string | null;
}): InquiryDateConstraints {
  const { today, start = '', end = '', calendarMinimum = null, calendarMaximum = null } = input;
  const startMin = calendarMinimum && calendarMinimum > today ? calendarMinimum : today;
  const calendarStartMaximum = calendarMaximum ? shiftIsoDate(calendarMaximum, -1) : null;
  const startMaximumFromEnd = end ? shiftIsoDate(end, -1) : null;
  const startMax = startMaximumFromEnd && calendarStartMaximum
    ? (startMaximumFromEnd < calendarStartMaximum ? startMaximumFromEnd : calendarStartMaximum)
    : startMaximumFromEnd || calendarStartMaximum;

  return {
    startMin,
    startMax,
    endMin: start ? shiftIsoDate(start, 1) : shiftIsoDate(startMin, 1),
    endMax: calendarMaximum,
  };
}
