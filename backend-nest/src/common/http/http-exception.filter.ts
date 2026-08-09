import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";

type ExceptionBody = {
  message?: string | string[];
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
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

    response.status(status).json({ data: { status, message } });
  }
}
