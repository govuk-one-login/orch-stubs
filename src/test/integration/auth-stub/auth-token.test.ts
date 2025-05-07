import { createApiGatewayEvent } from "../util";
import { handler } from "../../../main/auth-stub/auth-token";
import {
  addAuthCodeStore,
  getAccessTokenStore,
  getAuthCodeStore,
  resetAccessTokenStore,
  resetAuthCodeStore,
} from "./helpers/dynamo-helper";
import { createAuthCodeStoreInput } from "../../../main/auth-stub/test-helper/mock-auth-code-data-helper";

interface AuthTokenResponse {
  access_token: string;
  token_type: string;
}

const AUTH_CODE = "12345";

beforeEach(setUpAuthCode);
afterEach(() => {
  resetAccessTokenStore();
  resetAuthCodeStore();
});

describe("Auth Token", () => {
  it("should return 200 for valid POST request and update Dynamo", async () => {
    const response = await handler(
      createApiGatewayEvent(
        "POST",
        `code=${AUTH_CODE}`,
        {},
        {
          "Content-Type": "x-www-form-urlencoded",
        }
      ),
      null!,
      null!
    );

    expect(response.statusCode).toBe(200);
    const authTokenResponse: AuthTokenResponse = JSON.parse(response.body);
    expect(typeof authTokenResponse.access_token).toBe("string");
    expect(authTokenResponse.token_type).toBe("Bearer");
    expect(
      await getAccessTokenStore(authTokenResponse.access_token)
    ).toBeTruthy();
    const authCodeStore = await getAuthCodeStore(AUTH_CODE);
    expect(authCodeStore.hasBeenUsed).toBeTruthy();
  });
});

async function setUpAuthCode(): Promise<void> {
  await addAuthCodeStore(createAuthCodeStoreInput(AUTH_CODE));
}
