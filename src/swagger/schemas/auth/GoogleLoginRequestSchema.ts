import { SwaggerTypes } from "../../types/SwggaerTypes";

const GoogleLoginRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["idToken"],
  properties: {
    idToken: {
      type: SwaggerTypes.STRING,
    },
  },
};

export default GoogleLoginRequestSchema;
