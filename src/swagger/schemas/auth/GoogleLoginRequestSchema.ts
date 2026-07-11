import { SwaggerTypes } from "../../types/SwaggerTypes";

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
