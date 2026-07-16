import multer from "multer";
import { APIError } from "../errors/APIError";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import { APIErrorKeys } from "../errors/APIError-keys";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(
        new APIError({
          status: StatusCode.BAD_REQUEST,
          message: APIErrorKeys.imageUpload.invalidType,
        }),
      );
    }
    cb(null, true);
  },
});

export default upload;
