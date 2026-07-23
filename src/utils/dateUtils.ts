import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { DatePeriodFilters } from "../types/shared/types/DatePeriodFilters.enum";

dayjs.extend(utc);
dayjs.extend(timezone);

export const getDatePeriodMatch = (
  datePeriod: DatePeriodFilters,
  userTimezone: string = "UTC",
) => {
  const nowInUserTz = dayjs().tz(userTimezone);

  switch (datePeriod) {
    case DatePeriodFilters.LAST_WEEK: {
      const start = nowInUserTz.subtract(6, "day").startOf("day").toDate();
      const end = nowInUserTz.endOf("day").toDate();

      return { $gte: start, $lte: end };
    }

    case DatePeriodFilters.LAST_MONTH: {
      const start = nowInUserTz.subtract(29, "day").startOf("day").toDate();
      const end = nowInUserTz.endOf("day").toDate();

      return { $gte: start, $lte: end };
    }

    case DatePeriodFilters.TODAY:
    default: {
      const start = nowInUserTz.startOf("day").toDate();
      const end = nowInUserTz.endOf("day").toDate();

      return { $gte: start, $lte: end };
    }
  }
};
