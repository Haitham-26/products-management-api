import { AppLangs } from "../../../types/settings/types/AppLangs.enum";
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
    lang: {
      type: SwaggerTypes.STRING,
      enum: Object.values(AppLangs),
      example: AppLangs.EN,
    },
  },
};

export default UpdateSettingsRequestSchema;
