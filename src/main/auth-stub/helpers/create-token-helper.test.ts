import { createBearerAccessToken } from "./create-token-helper";
import { base64url } from "jose";

describe("Create Token Helper", () => {
  it("should return a bearer access token", () => {
    const bearerAccessToken = createBearerAccessToken();

    expect(base64url.decode(bearerAccessToken.access_token).length).toBe(32);
    expect(typeof bearerAccessToken.access_token).toBe("string");
    expect(bearerAccessToken.token_type).toBe("Bearer");
  });
});
