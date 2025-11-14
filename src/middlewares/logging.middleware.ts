import { Request, Response, NextFunction } from 'express';
import { IncomingHttpHeaders } from 'http';
import { v4 as uuidv4 } from 'uuid';
import appLogger, { filterSensitive } from '../utils/logging';

export function loggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const reqId = uuidv4();
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  req.reqId = reqId;

  const headers: IncomingHttpHeaders = req.headers;
  const isJson = headers['content-type']?.includes('application/json');

  let body: Record<string, any> | string = {};
  try {
    body = isJson ? filterSensitive(req.body) : '[Non-JSON body]';
  } catch {
    body = '[Unreadable body]';
  }

  appLogger.info('Incoming request', {
    reqId,
    ip: clientIp,
    method: req.method,
    path: req.originalUrl,
    headers,
    body,
  });

  const originalSend = res.send.bind(res);

  let responseBody: any;
  res.send = function (body) {
    responseBody = body;
    return originalSend(body);
  };

  res.on('finish', () => {
    let parsedBody: any;
    try {
      const isJsonResponse = res
        .getHeader('content-type')
        ?.toString()
        .includes('application/json');
      parsedBody = isJsonResponse ? JSON.parse(responseBody) : responseBody;
    } catch {
      parsedBody = '[Non-JSON response]';
    }

    const redactedResponse = Array.isArray(parsedBody)
      ? parsedBody.map((i) => filterSensitive(i))
      : filterSensitive(parsedBody);

    appLogger.info('Response sent', {
      reqId,
      statusCode: res.statusCode,
      body: redactedResponse,
    });
  });

  next();
}
