import { SwaggerTypes } from "../../types/SwggaerTypes";

const RequestMetaSchema = {
  type: SwaggerTypes.OBJECT,
  properties: {
    page: {
      type: SwaggerTypes.INTEGER,
      example: 1,
    },
    limit: {
      type: SwaggerTypes.INTEGER,
      example: 10,
    },
  },
};

export default RequestMetaSchema;
