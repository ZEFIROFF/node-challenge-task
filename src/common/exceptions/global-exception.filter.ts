import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  message: string | string[];
  error: string;
  path?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const errorResponse = this.buildErrorResponse(exception, request.url);

    this.logger.error(
      `[${errorResponse.error}] ${errorResponse.message}`,
      exception instanceof Error ? exception.stack : 'No stack trace',
    );

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildErrorResponse(exception: unknown, path: string): ErrorResponse {
    const timestamp = new Date().toISOString();

    // NestJS HttpException
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        return {
          statusCode: status,
          timestamp,
          message: exceptionResponse,
          error: exception.name,
          path,
        };
      } else if (typeof exceptionResponse === 'object') {
        return {
          statusCode: status,
          timestamp,
          message: (exceptionResponse as any).message || exception.message,
          error: (exceptionResponse as any).error || exception.name,
          path,
        };
      }
    }

    // Prisma errors
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaError(exception, timestamp, path);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp,
        message: 'Validation error in database operation',
        error: 'PrismaValidationError',
        path,
      };
    }

    // Standard Error
    if (exception instanceof Error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp,
        message: exception.message,
        error: exception.name,
        path,
      };
    }

    // Unknown error
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp,
      message: 'Internal server error',
      error: 'UnknownError',
      path,
    };
  }

  private handlePrismaError(
    exception: Prisma.PrismaClientKnownRequestError,
    timestamp: string,
    path: string,
  ): ErrorResponse {
    switch (exception.code) {
      case 'P2002':
        return {
          statusCode: HttpStatus.CONFLICT,
          timestamp,
          message: `Unique constraint failed on field: ${(exception.meta?.target as string[])?.join(
            ', ',
          )}`,
          error: 'UniqueConstraintViolation',
          path,
        };
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          timestamp,
          message: 'Record not found',
          error: 'RecordNotFound',
          path,
        };
      case 'P2003':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          timestamp,
          message: 'Foreign key constraint failed',
          error: 'ForeignKeyConstraintViolation',
          path,
        };
      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          timestamp,
          message: exception.message,
          error: `PrismaError:${exception.code}`,
          path,
        };
    }
  }
}
