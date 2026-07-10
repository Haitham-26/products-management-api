import { SwaggerTypes } from "../../types/SwggaerTypes";

const InviteMembersRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["emails"],
  properties: {
    emails: {
      type: SwaggerTypes.ARRAY,
      items: {
        type: SwaggerTypes.STRING,
        format: "email",
        example: "haitham@example.com",
      },
    },
  },
};

export default InviteMembersRequestSchema;
