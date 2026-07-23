import { SwaggerTypes } from "../../types/SwaggerTypes";

const GetDashboardStatsResponseSchema = {
  type: SwaggerTypes.OBJECT,
  properties: {
    totalRevenue: {
      type: SwaggerTypes.NUMBER,
      example: 1000,
    },
    totalProfit: {
      type: SwaggerTypes.NUMBER,
      example: 200,
    },
    ordersCountByStatus: {
      type: SwaggerTypes.OBJECT,
      properties: {
        pending: {
          type: SwaggerTypes.INTEGER,
          example: 10,
        },
        delivered: { type: SwaggerTypes.INTEGER, example: 50 },
        canceled: { type: SwaggerTypes.INTEGER, example: 5 },
      },
    },
    productsCountByStatus: {
      outOfStock: {
        type: SwaggerTypes.INTEGER,
        example: 5,
      },
      lowStock: {
        type: SwaggerTypes.INTEGER,
        example: 15,
      },
    },
    profitAndRevenue: {
      type: SwaggerTypes.ARRAY,
      items: {
        type: SwaggerTypes.OBJECT,
        properties: {
          date: {
            type: SwaggerTypes.STRING,
            example: "2026-7-23",
          },
          profit: {
            type: SwaggerTypes.NUMBER,
            example: 250,
          },
          revenue: {
            type: SwaggerTypes.NUMBER,
            example: 1500,
          },
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
