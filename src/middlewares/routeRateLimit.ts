import "reflect-metadata";
export interface RateLimitConfig { windowMs: number; max: number; }
export function RateLimit(cfg: RateLimitConfig) {
  return function(target:any, prop:any, descriptor:PropertyDescriptor) {
    Reflect.defineMetadata("rateLimit", cfg, descriptor.value);
    return descriptor;
  };
}
export function getRouteRateLimit(fn:any): RateLimitConfig | undefined {
  return Reflect.getMetadata("rateLimit", fn);
}
