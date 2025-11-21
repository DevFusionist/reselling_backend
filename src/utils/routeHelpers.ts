import { getRouteRateLimit } from "../middlewares/routeRateLimit";
import { slidingRateLimiter } from "../middlewares/slidingRateLimiter";

export function applyRouteLevelRateLimits(app:any) {
  try {
    const stack = app._router?.stack;
    if (!stack) return;
    for (const layer of stack) {
      if (layer?.route?.stack) {
        for (let i=0;i<layer.route.stack.length;i++) {
          const handler = layer.route.stack[i].handle;
          if (typeof handler !== "function") continue;
          const cfg = getRouteRateLimit(handler);
          if (!cfg) continue;
          const limiter = slidingRateLimiter(cfg);
          layer.route.stack[i].handle = ((orig, lim)=> {
            return (req:any,res:any,next:any) => {
              lim(req,res,(err?:any)=> {
                if (err) return next(err);
                return orig(req,res,next);
              });
            };
          })(handler, limiter);
        }
      }
    }
  } catch (err) {
    console.error("applyRouteLevelRateLimits err", err);
  }
}
