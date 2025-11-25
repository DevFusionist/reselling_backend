import { Context } from "hono";
import { shareLinkService } from "../services/shareLink.service";
import { CreateShareLinkDTO } from "../dtos/shareLink.dto";
import { success, failure } from "../utils/apiResponse";

export const shareLinkController = {
  async create(c: Context) {
    const user = c.get("user");
    const body = await c.req.json();
    const parsed = CreateShareLinkDTO.safeParse(body);
    if (!parsed.success) {
      return c.json(failure("Invalid input", "VALIDATION_ERROR"), 400);
    }

    const link = await shareLinkService.createShareLink(user.sub, parsed.data);
    return c.json(success(link, "Share link created successfully"));
  },

  async getByCode(c: Context) {
    const code = c.req.param("code");
    if (!code) {
      return c.json(failure("Share link code required", "VALIDATION_ERROR"), 400);
    }

    const link = await shareLinkService.getShareLinkByCode(code);
    return c.json(success(link));
  },

  async list(c: Context) {
    const user = c.get("user");
    const links = await shareLinkService.listShareLinks(user.sub);
    return c.json(success(links));
  },

  async delete(c: Context) {
    const user = c.get("user");
    const code = c.req.param("code");
    if (!code) {
      return c.json(failure("Share link code required", "VALIDATION_ERROR"), 400);
    }

    await shareLinkService.deleteShareLink(code, user.sub);
    return c.json(success(null, "Share link deleted successfully"));
  }
};

