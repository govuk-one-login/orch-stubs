import { createBearerAccessToken } from "./create-token-helper.ts";
import { base64url } from "jose";

describe("Create Token Helper", () => {
  it("should return a bearer access token", () => {
    const bearerAccessToken = createBearerAccessToken();

    expect(base64url.decode(bearerAccessToken.access_token)).toHaveLength(32);

    expectTypeOf(bearerAccessToken.access_token).toBeString();

    expect(bearerAccessToken.token_type).toBe("Bearer");
  });
});
