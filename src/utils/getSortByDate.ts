import { SortKind } from "../types/shared/types/SortKind.enum";

export const getSortByDate = (sortKind: SortKind) => {
  if (
    sortKind === SortKind.NEWEST ||
    !Object.values(SortKind).includes(sortKind as SortKind)
  ) {
    return -1;
  }
  return 1;
};
