import { AppLangs } from "../../../types/settings/types/AppLangs.enum";
import { SwaggerTypes } from "../../types/SwaggerTypes";

const ForgotPasswordEmailRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["email"],
  properties: {
    email: {
      type: SwaggerTypes.STRING,
      format: "email",
      example: "john@example.com",
    },
    lang: {
      type: SwaggerTypes.STRING,
      enum: Object.values(AppLangs),
      example: AppLangs.EN,
    },
    dir: {
      type: SwaggerTypes.STRING,
      enum: ["rtl", "ltr"],
      example: "rtl",
    },
  },
};

export default ForgotPasswordEmailRequestSchema;
