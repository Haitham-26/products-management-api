import { SwaggerTypes } from "../../types/SwggaerTypes";

const RefreshTokenRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["refreshToken"],
  properties: {
    refreshToken: {
      type: SwaggerTypes.STRING,
    },
  },
};

export default RefreshTokenRequestSchema;
