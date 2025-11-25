import { Hono } from "hono";
import { cors } from 'hono/cors';
import routes from './routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { responseMiddleware } from './middlewares/response.middleware';
import { requestIdMiddleware } from './middlewares/requestId.middleware';

const app = new Hono();

app.use('*', cors());
app.use('*', requestIdMiddleware);
app.use('*', errorMiddleware as any);
app.use('*', responseMiddleware as any);

app.get("/", (c) => c.json({ success: true, message: "Reseller E-Commerce API", data: { version: "1.0.0" } }));

app.route('/', routes);

export default app;
