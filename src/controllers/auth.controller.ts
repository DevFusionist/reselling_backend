import { Context } from "hono";
import { SignupDTO, LoginDTO } from "../dtos/auth.dto";
import { authService } from "../services/auth.service";
import { failure, success } from "../utils/apiResponse";
import { r2Service } from "../services/r2.service";

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

    const { accessToken, refreshToken, user } = await authService.login(parsed.data);
    return c.json(success({ accessToken, refreshToken, user }));
  },

  async refresh(c: Context) {
    try {
      let body: any = {};
      try {
        body = await c.req.json();
      } catch (error) {
        // If JSON parsing fails (empty body), body remains {}
      }

      const { refreshToken } = body;
      if (!refreshToken) {
        return c.json(failure("missing refreshToken", "VALIDATION_ERROR"), 400);
      }

      const tokens = await authService.refresh(refreshToken);
      return c.json(success(tokens));
    } catch (error: any) {
      return c.json(
        failure(error.message || "Failed to refresh token", "REFRESH_ERROR"),
        500
      );
    }
  },

  async logout(c: Context) {
    try {
      let body: any = {};
      try {
        body = await c.req.json();
      } catch (error) {
        // If JSON parsing fails (empty body), body remains {}
      }

      const { refreshToken } = body;

      console.log("refreshToken -- ", refreshToken, "body -- ", body);
      if (!refreshToken) {
        return c.json(failure("missing refreshToken", "VALIDATION_ERROR"), 400);
      }

      await authService.logout(refreshToken);
      return c.json(success(null, "logged out"));
    } catch (error: any) {
      return c.json(
        failure(error.message || "Failed to logout", "LOGOUT_ERROR"),
        500
      );
    }
  },

  async uploadProfilePicture(c: Context) {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json(failure("Unauthorized", "UNAUTHORIZED"), 401);
      }

      const formData = await c.req.formData();
      const imageFile = formData.get("image") as File | null;

      if (!imageFile || imageFile.size === 0) {
        return c.json(failure("Image file is required", "VALIDATION_ERROR"), 400);
      }

      // Validate image file type
      const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
      if (!validImageTypes.includes(imageFile.type)) {
        return c.json(
          failure("Invalid image type. Only JPEG, PNG, WEBP, and GIF are allowed", "VALIDATION_ERROR"),
          400
        );
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (imageFile.size > maxSize) {
        return c.json(
          failure("Image size exceeds 5MB limit", "VALIDATION_ERROR"),
          400
        );
      }

      // Upload to R2
      const imageUrl = await r2Service.uploadUserProfilePicture(imageFile, user.sub);

      // Update user profile picture in database
      const updatedUser = await authService.updateProfilePicture(user.sub, imageUrl);
      // Remove sensitive fields like password_hash before sending response
      const { password_hash, ...safeUser } = updatedUser;
      return c.json(success(safeUser, "Profile picture uploaded successfully"));
    } catch (error: any) {
      return c.json(
        failure(error.message || "Failed to upload profile picture", "UPLOAD_ERROR"),
        500
      );
    }
  }
};
