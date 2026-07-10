import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import SignUpEmailRequestSchema from "./schemas/auth/SignUpEmailRequestSchema";
import SignUpTokenRequestSchema from "./schemas/auth/SignUpTokenRequestSchema";
import RegisterResponseSchema from "./schemas/auth/RegisterResponseSchema";
import SignUpTokenResendRequestSchema from "./schemas/auth/SignUpTokenResendRequestSchema";
import LoginRequestSchema from "./schemas/auth/LoginRequestSchema";
import GoogleLoginRequestSchema from "./schemas/auth/GoogleLoginRequestSchema";
import RefreshTokenRequestSchema from "./schemas/auth/RefreshTokenRequestSchema";
import RefreshTokenResponseSchema from "./schemas/auth/RefreshTokenResponseSchema";
import ForgotPasswordEmailRequestSchema from "./schemas/auth/ForgotPasswordEmailRequestSchema";
import ForgotPasswordTokenRequestSchema from "./schemas/auth/ForgotPasswordTokenRequestSchema";
import ForgotPasswordNewRequestSchema from "./schemas/auth/ForgotPasswordNewRequestSchema";
import GetCategoriesResponseSchema from "./schemas/category/GetCategoriesResponseSchema";
import CreateCategoryRequestSchema from "./schemas/category/CreateCategoryRequestSchema";
import UpdateCategoryRequestSchema from "./schemas/category/UpdateCategoryRequestSchema";
import DeleteCategoryRequestSchema from "./schemas/category/DeleteCategoryRequestSchema";
import BulkDeleteCategoriesRequestSchema from "./schemas/category/BulkDeleteCategoriesRequestSchema";
import GetTagsResponseSchema from "./schemas/tag/GetTagsResponseSchema";
import CreateTagRequestSchema from "./schemas/tag/CreateTagRequestSchema";
import UpdateTagRequestSchema from "./schemas/tag/UpdateTagRequestSchema";
import DeleteTagRequestSchema from "./schemas/tag/DeleteTagRequestSchema";
import BulkDeleteTagsRequestSchema from "./schemas/tag/BulkDeleteTagRequestSchema";
import UserSchema from "./schemas/auth/UserSchema";
import ResetPasswordRequestSchema from "./schemas/user/ResetPasswordRequestSchema";
import UpdateUserRequestSchema from "./schemas/user/UpdateUserRequestSchema";
import GetDashboardStatsResponseSchema from "./schemas/dashboard/GetDashboardStatsResponseSchema";
import SettingsSchema from "./schemas/settings/SettingsSchema";
import UpdateSettingsRequestSchema from "./schemas/settings/UpdateSettingsRequestSchema";
import GetOwnerInvitationsResponseSchema from "./schemas/organization/GetOwnerInvitationsResponseSchema";
import InviteMembersRequestSchema from "./schemas/organization/InviteMembersRequestSchema";
import GenericWithInvitationIdRequestSchema from "./schemas/organization/GenericWithInvitationIdRequestSchema";
import GetOrgMembersResponseSchema from "./schemas/organization/GetOrgMembersResponseSchema";
import UpdateMembersPermissionsRequestSchema from "./schemas/organization/UpdateMembersPermissionsRequestSchema";
import RemoveMemberRequestSchema from "./schemas/organization/RemoveMemberRequestSchema";
import GetJoinOrgInvitationsResponseSchema from "./schemas/organization/GetJoinOrgInvitationsResponseSchema";
import GetOrdersResponseSchema from "./schemas/order/GetOrdersResponseSchema";
import CreateOrderRequestSchema from "./schemas/order/CreateOrderRequestSchema";
import UpdateOrderRequestSchema from "./schemas/order/UpdateOrderRequestSchema";
import BulkManageOrdersVisibilityRequestSchema from "./schemas/order/BulkManageOrdersVisibilityRequestSchema";
import ManageOrderVisibilityRequestSchema from "./schemas/order/ManageOrderVisibilityRequestSchema";
import BulkManageOrdersStatusRequestSchema from "./schemas/order/BulkManageOrdersStatusRequestSchema";
import ManageOrderStatusRequestSchema from "./schemas/order/ManageOrderStatusRequestSchema";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Products Management API",
      version: "1.0.0",
      description: "API documentation",
    },
    servers: [
      {
        url: "http://localhost:5000",
      },
    ],
    components: {
      schemas: {
        UserSchema,
        SignUpEmailRequestSchema,
        SignUpTokenRequestSchema,
        RegisterResponseSchema,
        SignUpTokenResendRequestSchema,
        LoginRequestSchema,
        GoogleLoginRequestSchema,
        RefreshTokenRequestSchema,
        RefreshTokenResponseSchema,
        ForgotPasswordEmailRequestSchema,
        ForgotPasswordTokenRequestSchema,
        ForgotPasswordNewRequestSchema,
        //
        GetCategoriesResponseSchema,
        CreateCategoryRequestSchema,
        UpdateCategoryRequestSchema,
        DeleteCategoryRequestSchema,
        BulkDeleteCategoriesRequestSchema,
        //
        GetTagsResponseSchema,
        CreateTagRequestSchema,
        UpdateTagRequestSchema,
        DeleteTagRequestSchema,
        BulkDeleteTagsRequestSchema,
        //
        ResetPasswordRequestSchema,
        UpdateUserRequestSchema,
        //
        GetDashboardStatsResponseSchema,
        //
        SettingsSchema,
        UpdateSettingsRequestSchema,
        //
        GetOwnerInvitationsResponseSchema,
        InviteMembersRequestSchema,
        GenericWithInvitationIdRequestSchema,
        GetOrgMembersResponseSchema,
        UpdateMembersPermissionsRequestSchema,
        RemoveMemberRequestSchema,
        GetJoinOrgInvitationsResponseSchema,
        //
        GetOrdersResponseSchema,
        CreateOrderRequestSchema,
        UpdateOrderRequestSchema,
        ManageOrderVisibilityRequestSchema,
        BulkManageOrdersVisibilityRequestSchema,
        ManageOrderStatusRequestSchema,
        BulkManageOrdersStatusRequestSchema,
      },
    },
  },
  apis: ["./src/services/**/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
