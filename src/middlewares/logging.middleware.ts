import { Request, Response, NextFunction } from 'express';
import { IncomingHttpHeaders } from 'http';
import { v4 as uuidv4 } from 'uuid';
import appLogger, { filterSensitive } from '../utils/logging';

// --- Middleware ---
export async function loggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const reqId = uuidv4();
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

  // Attach to request context
  (req as any).reqId = reqId;

  // Capture request info
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

  const originalSend = res.send;
  const chunks: any[] = [];

  res.send = function (chunk: any) {
    chunks.push(chunk);
    return originalSend.apply(res, arguments as any);
  };

  // Proceed with request
  try {
    await new Promise<void>((resolve, reject) => {
      res.on('finish', resolve);
      res.on('error', reject);
      next();
    });

    const rawBody = Buffer.concat(
      chunks.map((c) => (Buffer.isBuffer(c) ? c : Buffer.from(String(c))))
    ).toString('utf8');

    let parsedBody: any;
    try {
      parsedBody = res
        .getHeader('content-type')
        ?.toString()
        .includes('application/json')
        ? JSON.parse(rawBody)
        : rawBody;
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
  } catch (err: any) {
    if (err?.name?.includes('Sequelize') || err?.name?.includes('SQL')) {
      appLogger.error('Database failed', { reqId, error: err.message });
    } else {
      appLogger.error('Request failed', {
        reqId,
        error: err.message,
        stack: err.stack,
      });
    }
    next(err);
  }
}
