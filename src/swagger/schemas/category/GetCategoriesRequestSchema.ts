import { CreationDateFilters } from "../../../types/shared/types/CreationDateFilters.enum";
import { SwaggerTypes } from "../../types/SwggaerTypes";
import RequestMetaSchema from "../shared/RequestMetaSchema";

const GetCategoriesRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["userId"],
  properties: {
    userId: {
      type: SwaggerTypes.STRING,
      example: "6a9d...",
    },
    keyword: {
      type: SwaggerTypes.STRING,
      example: "electronics",
    },
    minChildrenCount: {
      type: SwaggerTypes.INTEGER,
      example: 5,
    },
    maxChildrenCount: {
      type: SwaggerTypes.INTEGER,
      example: 10,
    },
    creationDate: {
      type: SwaggerTypes.STRING,
      enum: Object.values(CreationDateFilters),
      example: CreationDateFilters.NEWEST,
    },
    meta: RequestMetaSchema,
  },
};

export default GetCategoriesRequestSchema;
