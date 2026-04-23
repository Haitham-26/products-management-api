import express from "express";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import {
  createTag,
  deleteTag,
  getTags,
  updateTag,
} from "../controllers/tag.controller";
import { UpdateTagValidator } from "../validators/tag/update-tag.validator";
import { CreateTagValidator } from "../validators/tag/create-tag.validator";
import { DeleteTagValidator } from "../validators/tag/delete-tag.validator";

const tagRouter = express.Router();

tagRouter.get("/", AuthMiddleware, getTags);
tagRouter.delete("/:id/delete", AuthMiddleware, DeleteTagValidator, deleteTag);
tagRouter.post("/create", AuthMiddleware, CreateTagValidator, createTag);
tagRouter.patch("/:id/update", AuthMiddleware, UpdateTagValidator, updateTag);

export default tagRouter;
