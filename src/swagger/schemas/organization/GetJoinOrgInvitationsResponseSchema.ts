import { SwaggerTypes } from "../../types/SwggaerTypes";

const GetJoinOrgInvitationsResponseSchema = {
  type: SwaggerTypes.OBJECT,
  properties: {
    invitations: {
      type: SwaggerTypes.ARRAY,
      items: {
        type: SwaggerTypes.OBJECT,
        properties: {
          _id: {
            type: SwaggerTypes.STRING,
            example: "6a9d...",
          },
          inviter: {
            type: SwaggerTypes.OBJECT,
            properties: {
              name: {
                type: SwaggerTypes.STRING,
                example: "Haitham Waki",
              },
              company: {
                type: SwaggerTypes.STRING,
                example: "Inventix",
              },
            },
          },
          createdAt: {
            type: SwaggerTypes.STRING,
            format: "date-time",
          },
          updatedAt: {
            type: SwaggerTypes.STRING,
            format: "date-time",
          },
        },
      },
    },
  },
};

export default GetJoinOrgInvitationsResponseSchema;
