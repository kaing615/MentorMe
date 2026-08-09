import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { ExceptionFilter } from "@nestjs/common";
import type { Request, Response } from "express";

type ExceptionBody = {
  message?: string | string[];
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionBody =
      exception instanceof HttpException
        ? (exception.getResponse() as string | ExceptionBody)
        : undefined;
    const rawMessage =
      typeof exceptionBody === "string" ? exceptionBody : exceptionBody?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(", ")
      : rawMessage ||
        (status === 500
          ? "Oops! Something went wrong"
          : HttpStatus[status]);

    if (
      status === 400 &&
      Array.isArray(rawMessage) &&
      request.path.startsWith("/api/v1/user/")
    ) {
      response.status(status).json({
        message: "Validation error",
        details: rawMessage.map((item) => ({ message: item })),
      });
      return;
    }

    response.status(status).json({ data: { status, message } });
  }
}
