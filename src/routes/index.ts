import { Hono } from "hono";
import auth from "./auth.routes";
import payment from "./payment.routes";
import product from "./product.routes";
import markup from "./markup.routes";
import shareLink from "./shareLink.routes";
import order from "./order.routes";

const app = new Hono();

app.route("/auth", auth);
app.route("/payments", payment);
app.route("/products", product);
app.route("/markups", markup);
app.route("/share", shareLink);
app.route("/orders", order);

export default app;
