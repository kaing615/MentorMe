import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import type { Observable } from "rxjs";
import { map } from "rxjs";

@Injectable()
export class CompatibilityInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ path?: string }>();
    if (request.path?.startsWith("/health/")) {
      return next.handle();
    }

    return next.handle().pipe(map((data: unknown) => ({ data })));
  }
}
