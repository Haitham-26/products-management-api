import { SwaggerTypes } from "../../types/SwggaerTypes";

const GetDashboardStatsResponseSchema = {
  type: SwaggerTypes.OBJECT,
  properties: {
    products: {
      type: SwaggerTypes.OBJECT,
      properties: {
        totalCount: {
          type: SwaggerTypes.INTEGER,
          example: 10,
        },
        todayCount: {
          type: SwaggerTypes.INTEGER,
          example: 10,
        },
        lastWeekCount: {
          type: SwaggerTypes.INTEGER,
          example: 10,
        },
        lastMonthCount: {
          type: SwaggerTypes.INTEGER,
          example: 10,
        },
      },
    },
    orders: {
      type: SwaggerTypes.OBJECT,
      properties: {
        totalCount: {
          type: SwaggerTypes.INTEGER,
          example: 10,
        },
        todayCount: {
          type: SwaggerTypes.INTEGER,
          example: 10,
        },
        lastWeekCount: {
          type: SwaggerTypes.INTEGER,
          example: 10,
        },
        lastMonthCount: {
          type: SwaggerTypes.INTEGER,
          example: 10,
        },
      },
    },
    lowStockProducts: {
      type: SwaggerTypes.OBJECT,
      properties: {
        totalCount: {
          type: SwaggerTypes.INTEGER,
          example: 10,
        },
      },
    },
    outOfStockProducts: {
      type: SwaggerTypes.OBJECT,
      properties: {
        totalCount: {
          type: SwaggerTypes.INTEGER,
          example: 10,
        },
      },
    },
    mostSoldProducts: {
      type: SwaggerTypes.ARRAY,
      items: {
        type: SwaggerTypes.OBJECT,
        properties: {
          _id: {
            type: SwaggerTypes.STRING,
            example: "6a9d...",
          },
          name: {
            type: SwaggerTypes.STRING,
            example: "Iphone 14",
          },
          totalSold: {
            type: SwaggerTypes.INTEGER,
            example: 10,
          },
          image: {
            type: SwaggerTypes.STRING,
            example: "https://example.com/image.jpg",
          },
        },
      },
    },
  },
};

export default GetDashboardStatsResponseSchema;
