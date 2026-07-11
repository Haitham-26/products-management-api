import { SwaggerTypes } from "../../types/SwaggerTypes";
import ResponseMetaSchema from "../shared/ResponseMetaSchema";

const GetTagsResponseSchema = {
  type: SwaggerTypes.OBJECT,
  properties: {
    data: {
      type: SwaggerTypes.ARRAY,
      items: {
        type: SwaggerTypes.OBJECT,
        properties: {
          _id: {
            type: SwaggerTypes.STRING,
            example: "6a9d...",
          },
          name: {
            type: SwaggerTypes.STRING,
            example: "Premium",
          },
          description: {
            type: SwaggerTypes.STRING,
            example: "This tag is added to premium products",
          },
          usageCount: {
            type: SwaggerTypes.INTEGER,
            example: 10,
          },
          createdAt: {
            type: SwaggerTypes.STRING,
            format: "date-time",
          },
          updatedAt: {
            type: SwaggerTypes.STRING,
            format: "date-time",
          },
        },
      },
    },
    meta: ResponseMetaSchema,
  },
};

export default GetTagsResponseSchema;
