import { Context } from "hono";
import { SignupDTO, LoginDTO } from "../dtos/auth.dto";
import { authService } from "../services/auth.service";
import { failure, success } from "../utils/apiResponse";

export const authController = {
  async signup(c: Context) {
    const body = await c.req.json();
    const parsed = SignupDTO.safeParse(body);
    if (!parsed.success) return c.json(failure("Invalid input", "VALIDATION_ERROR"), 400);

    const { accessToken, refreshToken } = await authService.signup(parsed.data);
    return c.json(success({ accessToken, refreshToken }));
  },

  async login(c: Context) {
    const body = await c.req.json();
    const parsed = LoginDTO.safeParse(body);
    if (!parsed.success) return c.json(failure("Invalid input", "VALIDATION_ERROR"), 400);

    const { accessToken, refreshToken } = await authService.login(parsed.data);
    return c.json(success({ accessToken, refreshToken }));
  },

  async refresh(c: Context) {
    const body = await c.req.json();
    const { refreshToken } = body;
    if (!refreshToken) return c.json(failure("missing refreshToken"), 400);

    const tokens = await authService.refresh(refreshToken);
    return c.json(success(tokens));
  },

  async logout(c: Context) {
    const body = await c.req.json();
    const { refreshToken } = body;
    if (!refreshToken) return c.json(failure("missing refreshToken"), 400);
    await authService.logout(refreshToken);
    return c.json(success(null, "logged out"));
  }
};
