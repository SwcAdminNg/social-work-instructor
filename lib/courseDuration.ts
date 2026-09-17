export type CourseDurationFields = {
  estimated_duration?: string | null;
  estimated_total_minutes?: number | null;
};

export function getCourseDurationLabel(course: CourseDurationFields) {
  if (course.estimated_duration) return course.estimated_duration;

  if (
    typeof course.estimated_total_minutes === "number" &&
    course.estimated_total_minutes > 0
  ) {
    return formatEstimatedDuration(course.estimated_total_minutes);
  }

  return null;
}

export function formatEstimatedDuration(totalMinutes: number) {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return null;

  const minutes = Math.floor(totalMinutes);
  if (minutes < 60) return unit(minutes, "min", "mins");

  const hours = Math.floor(minutes / 60);
  const minuteRemainder = minutes % 60;
  if (hours < 24) {
    return joinDuration(
      unit(hours, "hr", "hrs"),
      minuteRemainder > 0 ? unit(minuteRemainder, "min", "mins") : null,
    );
  }

  const days = Math.floor(hours / 24);
  const hourRemainder = hours % 24;
  if (days < 7) {
    return joinDuration(
      unit(days, "day", "days"),
      hourRemainder > 0 ? unit(hourRemainder, "hr", "hrs") : null,
    );
  }

  const weeks = Math.floor(days / 7);
  const dayRemainder = days % 7;
  return joinDuration(
    unit(weeks, "week", "weeks"),
    dayRemainder > 0 ? unit(dayRemainder, "day", "days") : null,
  );
}

function unit(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function joinDuration(primary: string, secondary: string | null) {
  return secondary ? `${primary} ${secondary}` : primary;
}
