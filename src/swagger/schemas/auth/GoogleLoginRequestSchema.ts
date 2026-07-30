import { GoogleRedirectURLs } from "../../../types/auth/google-login/GoogleRedirectURLs.enum";
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
    redirectUrl: {
      type: SwaggerTypes.STRING,
      enum: Object.values(GoogleRedirectURLs),
      example: GoogleRedirectURLs.LOGIN,
    },
  },
};

export default GoogleLoginRequestSchema;
