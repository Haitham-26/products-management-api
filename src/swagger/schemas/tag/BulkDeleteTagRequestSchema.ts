import { SwaggerTypes } from "../../types/SwaggerTypes";

const BulkDeleteTagsRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["userId", "tagIds"],
  properties: {
    userId: {
      type: SwaggerTypes.STRING,
      example: "6a9d...",
    },
    tagIds: {
      type: SwaggerTypes.ARRAY,
      items: {
        type: SwaggerTypes.STRING,
        example: "6a9d...",
      },
    },
  },
};

export default BulkDeleteTagsRequestSchema;
