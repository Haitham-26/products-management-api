import { Request } from "express";

const CONTEXT_KEY = "__context__";

export function RequestContext<T extends Record<string, any>>(
  req: Request,
  data?: Partial<T>
): T {
  if (!(CONTEXT_KEY in req)) {
    (req as any)[CONTEXT_KEY] = {};
  }

  const context = (req as any)[CONTEXT_KEY] as T;

  if (data) {
    Object.assign(context, data);
  }

  return context;
}
