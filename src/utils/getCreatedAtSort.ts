import { CreationDateFilters } from "../types/shared/types/CreationDateFilters.enum";

export const getCreatedAtSort = (creationDate: CreationDateFilters) => {
  if (
    creationDate === CreationDateFilters.NEWEST ||
    !Object.values(CreationDateFilters).includes(
      creationDate as CreationDateFilters,
    )
  ) {
    return -1;
  }
  return 1;
};
