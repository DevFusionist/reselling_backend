import { Hono } from "hono";
import auth from "./auth.routes";
import payment from "./payment.routes";
import product from "./product.routes";
import markup from "./markup.routes";
import shareLink from "./shareLink.routes";
import order from "./order.routes";
import attribute from "./attribute.routes";
import review from "./review.routes";

const app = new Hono();

app.route("/auth", auth);
app.route("/payments", payment);
app.route("/products", product);
app.route("/markups", markup);
app.route("/share", shareLink);
app.route("/orders", order);
app.route("/attributes", attribute);
app.route("/reviews", review);

export default app;
