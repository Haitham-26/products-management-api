import { Schema } from "mongoose";

const Types = Schema.Types;

export const SchemaTypes = {
  Map: Types.Map,
  String: Types.String,
  Number: Types.Number,
  Date: Types.Date,
  Boolean: Types.Boolean,
  ObjectId: Types.ObjectId,
};
