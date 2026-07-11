import { SwaggerTypes } from "../../types/SwaggerTypes";
import currencyCodes from "currency-codes";

const UpdateSettingsRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["userId"],
  properties: {
    userId: {
      type: SwaggerTypes.STRING,
      example: "6a9d...",
    },
    inventory: {
      type: SwaggerTypes.OBJECT,
      properties: {
        defaultMinStock: {
          type: SwaggerTypes.INTEGER,
          example: 20,
        },
      },
    },
    currency: {
      type: SwaggerTypes.STRING,
      enum: currencyCodes.codes(),
      example: "USD",
    },
  },
};

export default UpdateSettingsRequestSchema;
