import { SwaggerTypes } from "../../types/SwaggerTypes";
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
