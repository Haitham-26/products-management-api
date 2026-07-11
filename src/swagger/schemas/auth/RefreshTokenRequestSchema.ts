import { SwaggerTypes } from "../../types/SwaggerTypes";

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
