import { SwaggerTypes } from "../../types/SwggaerTypes";
import currencyCodes from "currency-codes";

const SettingsSchema = {
  type: SwaggerTypes.OBJECT,
  properties: {
    _id: {
      type: SwaggerTypes.STRING,
      example: "6a9d...",
    },
    userId: {
      type: SwaggerTypes.STRING,
      example: "6a9d...",
    },
    inventory: {
      type: SwaggerTypes.OBJECT,
      properties: {
        defaultMinStock: {
          type: SwaggerTypes.INTEGER,
          example: 10,
        },
      },
    },
    currency: {
      type: SwaggerTypes.STRING,
      enum: currencyCodes.codes(),
      example: "USD",
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
};

export default SettingsSchema;
