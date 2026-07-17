import { AppLangs } from "../../../types/settings/types/AppLangs.enum";
import { SwaggerTypes } from "../../types/SwaggerTypes";

const SignUpEmailRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["name", "email", "password"],
  properties: {
    name: {
      type: SwaggerTypes.STRING,
      example: "Haitham Waki",
    },
    company: {
      type: SwaggerTypes.STRING,
      example: "Example Company",
    },
    email: {
      type: SwaggerTypes.STRING,
      format: "email",
      example: "john@example.com",
    },
    password: {
      type: SwaggerTypes.STRING,
      example: "password123",
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

export default SignUpEmailRequestSchema;
