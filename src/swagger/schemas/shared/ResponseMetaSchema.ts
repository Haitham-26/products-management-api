import { SwaggerTypes } from "../../types/SwggaerTypes";

const ResponseMetaSchema = {
  type: SwaggerTypes.OBJECT,
  properties: {
    page: {
      type: SwaggerTypes.INTEGER,
      example: 1,
    },
    total: {
      type: SwaggerTypes.INTEGER,
      example: 10,
    },
    limit: {
      type: SwaggerTypes.INTEGER,
      example: 10,
    },
  },
};

export default ResponseMetaSchema;
