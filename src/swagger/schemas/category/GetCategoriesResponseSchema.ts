import { SwaggerTypes } from "../../types/SwggaerTypes";
import ResponseMetaSchema from "../shared/ResponseMetaSchema";

const GetCategoriesResponseSchema = {
  type: SwaggerTypes.OBJECT,
  properties: {
    data: {
      type: SwaggerTypes.ARRAY,
      items: {
        type: SwaggerTypes.OBJECT,
        properties: {
          _id: {
            type: SwaggerTypes.STRING,
          },
          name: {
            type: SwaggerTypes.STRING,
          },
          description: {
            type: SwaggerTypes.STRING,
          },
          childrenCount: {
            type: SwaggerTypes.INTEGER,
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

export default GetCategoriesResponseSchema;
