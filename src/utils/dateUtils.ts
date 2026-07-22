import { DatePeriodFilters } from "../types/shared/types/DatePeriodFilters.enum";

export const getDatePeriodMatch = (datePeriod: DatePeriodFilters) => {
  const now = new Date();

  switch (datePeriod) {
    case DatePeriodFilters.LAST_WEEK: {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      return {
        $gte: sevenDaysAgo,
        $lte: now,
      };
    }

    case DatePeriodFilters.LAST_MONTH: {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 29);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      return {
        $gte: thirtyDaysAgo,
        $lte: now,
      };
    }

    case DatePeriodFilters.TODAY:
    default: {
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);

      return {
        $gte: startOfToday,
        $lte: now,
      };
    }
  }
};
