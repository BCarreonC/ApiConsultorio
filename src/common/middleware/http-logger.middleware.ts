import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';

const REDACTED_VALUE = '[REDACTED]';
const TRUNCATED_VALUE = '[TRUNCATED]';

const SENSITIVE_KEYS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'password',
  'currentpassword',
  'newpassword',
  'oldpassword',
  'confirmpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'jwttoken',
  'jwtsecret',
  'secret',
  'apikey',
  'api-key',
]);

interface RequestLogPayload {
  event: 'http.request.started';
  requestId: string;
  method: string;
  path: string;
  ip?: string;
  userAgent?: string;
  contentType?: string;
  contentLength?: string;
  query?: unknown;
  body?: unknown;
}

interface ResponseLogPayload {
  event: 'http.request.completed' | 'http.request.aborted';
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  responseLength?: string;
  responseBody?: unknown;
}

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');
  private readonly logRequestBody: boolean;
  private readonly logResponseBody: boolean;
  private readonly maxBodyLength: number;

  constructor(private readonly configService: ConfigService) {
    this.logRequestBody =
      this.configService.get<boolean>('logging.httpRequestBody') ?? false;
    this.logResponseBody =
      this.configService.get<boolean>('logging.httpResponseBody') ?? false;
    this.maxBodyLength =
      this.configService.get<number>('logging.httpMaxBodyLength') ?? 4000;
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const startedAt = process.hrtime.bigint();
    const requestId = this.resolveRequestId(req);
    const method = req.method;
    const path = req.originalUrl || req.url;

    res.setHeader('X-Request-Id', requestId);

    let capturedResponseBody: unknown;

    if (this.logResponseBody) {
      this.captureResponseBody(res, (body) => {
        if (capturedResponseBody === undefined) {
          capturedResponseBody = body;
        }
      });
    }

    const requestPayload: RequestLogPayload = {
      event: 'http.request.started',
      requestId,
      method,
      path,
      ip: this.resolveClientIp(req),
      userAgent: req.get('user-agent'),
      contentType: req.get('content-type'),
      contentLength: req.get('content-length'),
    };

    if (Object.keys(req.query).length > 0) {
      requestPayload.query = this.prepareForLog(req.query);
    }

    if (this.logRequestBody && this.hasBody(req.body)) {
      requestPayload.body = this.prepareForLog(req.body);
    }

    this.logger.log(this.stringify(requestPayload));

    let completed = false;

    res.once('finish', () => {
      completed = true;

      const responsePayload: ResponseLogPayload = {
        event: 'http.request.completed',
        requestId,
        method,
        path,
        statusCode: res.statusCode,
        durationMs: this.elapsedMilliseconds(startedAt),
        responseLength: this.headerToString(res.getHeader('content-length')),
      };

      if (this.logResponseBody && capturedResponseBody !== undefined) {
        responsePayload.responseBody = this.prepareForLog(capturedResponseBody);
      }

      this.writeResponseLog(responsePayload);
    });

    res.once('close', () => {
      if (completed) {
        return;
      }

      const responsePayload: ResponseLogPayload = {
        event: 'http.request.aborted',
        requestId,
        method,
        path,
        statusCode: res.statusCode,
        durationMs: this.elapsedMilliseconds(startedAt),
      };

      this.logger.warn(this.stringify(responsePayload));
    });

    next();
  }

  private resolveRequestId(req: Request): string {
    const incomingRequestId = req.get('x-request-id')?.trim();

    if (incomingRequestId && incomingRequestId.length <= 128) {
      return incomingRequestId;
    }

    return randomUUID();
  }

  private resolveClientIp(req: Request): string | undefined {
    const forwardedFor = req.get('x-forwarded-for');

    if (forwardedFor) {
      return forwardedFor.split(',')[0]?.trim();
    }

    return req.ip || req.socket.remoteAddress;
  }

  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
  private captureResponseBody(
    res: Response,
    onBody: (body: unknown) => void,
  ): void {
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    res.json = ((body: unknown) => {
      onBody(body);
      return originalJson(body);
    }) as Response['json'];

    res.send = ((body?: unknown) => {
      onBody(body);
      return originalSend(body);
    }) as Response['send'];
  }

  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */

  private writeResponseLog(payload: ResponseLogPayload): void {
    const message = this.stringify(payload);

    if (payload.statusCode >= 500) {
      this.logger.error(message);
      return;
    }

    if (payload.statusCode >= 400) {
      this.logger.warn(message);
      return;
    }

    this.logger.log(message);
  }

  private prepareForLog(value: unknown): unknown {
    const sanitized = this.sanitize(value, new WeakSet<object>(), 0);
    const serialized = this.stringify(sanitized);

    if (serialized.length <= this.maxBodyLength) {
      return sanitized;
    }

    return `${serialized.slice(0, this.maxBodyLength)}${TRUNCATED_VALUE}`;
  }

  private sanitize(
    value: unknown,
    seen: WeakSet<object>,
    depth: number,
  ): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string' || typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : String(value);
    }

    if (typeof value === 'bigint') {
      return value.toString();
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Buffer.isBuffer(value)) {
      return `[Buffer ${value.length} bytes]`;
    }

    if (typeof value === 'symbol') {
      return value.description ? `[Symbol ${value.description}]` : '[Symbol]';
    }

    if (typeof value === 'function') {
      return `[Function ${value.name || 'anonymous'}]`;
    }

    if (typeof value !== 'object') {
      return '[UNKNOWN_VALUE]';
    }

    if (depth >= 8) {
      return '[MAX_DEPTH]';
    }

    if (seen.has(value)) {
      return '[CIRCULAR]';
    }

    seen.add(value);

    if (Array.isArray(value)) {
      return value
        .slice(0, 100)
        .map((item) => this.sanitize(item, seen, depth + 1));
    }

    const result: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      if (this.isSensitiveKey(key)) {
        result[key] = REDACTED_VALUE;
        continue;
      }

      result[key] = this.sanitize(nestedValue, seen, depth + 1);
    }

    return result;
  }

  private isSensitiveKey(key: string): boolean {
    const normalizedKey = key.replace(/[_\s]/g, '').toLowerCase();
    return SENSITIVE_KEYS.has(normalizedKey);
  }

  private hasBody(body: unknown): boolean {
    if (body === null || body === undefined) {
      return false;
    }

    if (typeof body !== 'object') {
      return true;
    }

    return Object.keys(body).length > 0;
  }

  private elapsedMilliseconds(startedAt: bigint): number {
    const milliseconds =
      Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    return Math.round(milliseconds * 100) / 100;
  }

  private headerToString(
    header: number | string | string[] | undefined,
  ): string | undefined {
    if (header === undefined) {
      return undefined;
    }

    return Array.isArray(header) ? header.join(',') : String(header);
  }

  private stringify(value: unknown): string {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
}
