import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { secureHeaders } from 'hono/secure-headers';

import { cacheControlMiddleware } from '../middlewares/cacheControlMiddleware';
import { compressMiddleware } from '../middlewares/compressMiddleware';
import { createMiddleware } from 'hono/factory';

import { adminApp } from './admin';
import { apiApp } from './api';
import { imageApp } from './image';
import { staticApp } from './static';

const app = new Hono();

// CORPヘッダを設定するミドルウェア
const corpMiddleware = createMiddleware((c, next) => {
  // 例: 同一オリジンまたは同一サイトの読み込みのみを許可
  c.header('Cross-Origin-Resource-Policy', 'same-site')
  return next()
})



app.use(secureHeaders({"crossOriginResourcePolicy": "cross-origin", "crossOriginEmbedderPolicy": "cross-origin", "crossOriginOpenerPolicy": "cross-origin"}));
app.use(
  cors({
    allowHeaders: ['Content-Type', 'Accept-Encoding', 'X-Accept-Encoding', 'Authorization', 'Cross-Origin-Resource-Policy'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    credentials: true,
    exposeHeaders: ['Content-Encoding', 'X-Content-Encoding'],
    origin: ['http://localhost:8080', 'http://localhost:8000','http://localhost:3000','https://web-speed-vercel.anpan-playground.com'],
  }),
);
app.use(compressMiddleware);
app.use(cacheControlMiddleware);
app.use(corpMiddleware)

app.get('/healthz', (c) => {
  return c.body('live', 200);
});
app.route('/', staticApp);
app.route('/', imageApp);
app.route('/', apiApp);
app.route('/', adminApp);

app.onError((cause) => {
  console.error(cause);

  if (cause instanceof HTTPException) {
    return cause.getResponse();
  }

  const err = new HTTPException(500, {
    cause: cause,
    message: 'Internal server error.',
  });
  return err.getResponse();
});

export { app };
