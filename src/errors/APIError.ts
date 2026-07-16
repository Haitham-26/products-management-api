export class APIError extends Error {
  constructor({
    status,
    message,
    params,
  }: {
    status: number;
    message: string;
    params?: Record<string, string>;
  }) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.message = message;
    this.params = params;
  }

  status: number;
  message: string;
  params?: Record<string, string>;
}
