import { SwaggerTypes } from "../../types/SwggaerTypes";
import UserSchema from "./UserSchema";

const RegisterResponseSchema = {
  type: SwaggerTypes.OBJECT,
  properties: {
    user: UserSchema,
    accessToken: {
      type: SwaggerTypes.STRING,
    },
    refreshToken: {
      type: SwaggerTypes.STRING,
    },
  },
};

export default RegisterResponseSchema;
