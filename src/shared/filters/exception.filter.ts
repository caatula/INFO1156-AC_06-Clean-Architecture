import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    NotFoundException,
} from "@nestjs/common"
import { Request, Response } from "express"
import { DomainException } from "@/shared/exceptions/domain.exception"

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse<Response>()
        const request = ctx.getRequest<Request>()

        let status = HttpStatus.INTERNAL_SERVER_ERROR
        let body = {
            ok: false,
            message: "Internal server error",
            timestamp: new Date().toISOString(),
            path: request.url,
        }

        if (exception instanceof NotFoundException) {
            status = HttpStatus.NOT_FOUND
            const exceptionResponse = exception.getResponse()
            body = {
                ok: false,
                message:
                    typeof exceptionResponse === "string"
                        ? exceptionResponse
                        : ((exceptionResponse as any).message ??
                          exception.message),
                timestamp: new Date().toISOString(),
                path: request.url,
            }
        } else if (exception instanceof HttpException) {
            status = exception.getStatus()
            const exceptionResponse = exception.getResponse()
            body = {
                ok: false,
                message:
                    typeof exceptionResponse === "string"
                        ? exceptionResponse
                        : ((exceptionResponse as any).message ??
                          exception.message),
                timestamp: new Date().toISOString(),
                path: request.url,
            }
        } else if (exception instanceof DomainException) {
            status = HttpStatus.BAD_REQUEST
            body = {
                ok: false,
                message: exception.message,
                timestamp: new Date().toISOString(),
                path: request.url,
            }
        }

        response.status(status).json(body)
    }
}
