import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { DatePeriodFilters } from "../types/shared/types/DatePeriodFilters.enum";
import isString from "lodash/isString";
import isNaN from "lodash/isNaN";
import isNumber from "lodash/isNumber";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

dayjs.extend(utc);
dayjs.extend(timezone);

export const getDatePeriodMatch = (
  datePeriod: DatePeriodFilters,
  userTimezone: string = "UTC",
) => {
  const nowInUserTz = dayjs().tz(userTimezone);

  switch (datePeriod) {
    case DatePeriodFilters.LAST_7_DAYS: {
      const start = nowInUserTz.subtract(6, "day").startOf("day").toDate();
      const end = nowInUserTz.endOf("day").toDate();

      return { $gte: start, $lte: end };
    }

    case DatePeriodFilters.LAST_30_DAYS: {
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

export const isValidDate = (date?: any) => {
  if (!date) {
    return false;
  }

  if (date instanceof Date) {
    return !isNaN(date.getTime());
  }

  if (isNumber(date)) {
    return !isNaN(date) && dayjs(date).isValid();
  }

  if (isString(date)) {
    return dayjs(date, undefined, true).isValid();
  }

  return false;
};
