import { GoogleRedirectPaths } from "../../../types/auth/google-login/GoogleRedirectPaths.enum";
import { AppLangs } from "../../../types/settings/types/AppLangs.enum";
import { SwaggerTypes } from "../../types/SwaggerTypes";

const GoogleLoginRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["code", "redirectUrl"],
  properties: {
    code: {
      type: SwaggerTypes.STRING,
    },
    lang: {
      type: SwaggerTypes.STRING,
      enum: Object.values(AppLangs),
      example: AppLangs.EN,
    },
    redirectPath: {
      type: SwaggerTypes.STRING,
      enum: Object.values(GoogleRedirectPaths),
      example: GoogleRedirectPaths.LOGIN,
    },
  },
};

export default GoogleLoginRequestSchema;
