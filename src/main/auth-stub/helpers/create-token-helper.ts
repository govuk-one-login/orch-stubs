import { randomBytes } from "crypto";
import { base64url } from "jose";

export const createBearerAccessToken = () => {
  return {
    access_token: base64url.encode(randomBytes(32)),
    token_type: "Bearer",
  };
};
