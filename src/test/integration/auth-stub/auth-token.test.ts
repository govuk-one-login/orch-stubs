import { createApiGatewayEvent } from "../util";
import { handler } from "../../../main/auth-stub/auth-token";
import {
  addAuthCodeStore,
  getAccessTokenStore,
  getAuthCodeStore,
  resetAccessTokenStore,
  resetAuthCodeStore,
} from "./helpers/dynamo-helper";
import {
  createAuthCodeStoreInput,
  createAuthCodeStoreThatHasBeenUsed,
} from "../../../main/auth-stub/test-helper/mock-auth-code-data-helper";
import { SignJWT } from "jose";
import { generateKeyPairSync, KeyObject, KeyPairKeyObjectResult } from "crypto";
import {
  mockEnvVariableSetup,
  mockSigningKeyEnv,
  orchToAuthExpectedClientId,
} from "./helpers/test-setup";

interface AuthTokenResponse {
  access_token: string;
  token_type: string;
}

const AUTH_CODE = "12345";

describe("Auth Token", () => {
  let ecKeyPair: KeyPairKeyObjectResult;

  beforeEach(async () => {
    mockEnvVariableSetup();
    await setUpAuthCode();
    ecKeyPair = generateKeyPairSync("ec", { namedCurve: "P-256" });
    mockSigningKeyEnv(ecKeyPair.publicKey);
  });

  afterEach(async () => {
    await resetAccessTokenStore();
    await resetAuthCodeStore();
  });

  it("should return 200 for valid POST request and update Dynamo", async () => {
    const response = await handler(
      createApiGatewayEvent(
        "POST",
        await generateQuery(
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          AUTH_CODE,
          "authorization_code",
          orchToAuthExpectedClientId,
          ecKeyPair.privateKey
        ),
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

  it("should return a 400 error for invalid auth-code", async () => {
    const invalidAuthCode = "543212345";
    await addAuthCodeStore(createAuthCodeStoreThatHasBeenUsed(invalidAuthCode));

    const response = await handler(
      createApiGatewayEvent(
        "POST",
        await generateQuery(
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          invalidAuthCode,
          "authorization_code",
          orchToAuthExpectedClientId,
          ecKeyPair.privateKey
        ),
        {},
        {
          "Content-Type": "x-www-form-urlencoded",
        }
      ),
      null!,
      null!
    );

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toBe(
      "Invalid Auth Code: already in use"
    );
  });

  it("should return a 400 error for invalid text-parameters", async () => {
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

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toBe(
      "Request is missing grant_type parameter"
    );
  });

  it("should return a 400 error for invalid client-assertion-type", async () => {
    const response = await handler(
      createApiGatewayEvent(
        "POST",
        await generateQuery(
          "invalidClientAssertionType",
          AUTH_CODE,
          "authorization_code",
          orchToAuthExpectedClientId,
          ecKeyPair.privateKey
        ),
        {},
        {
          "Content-Type": "x-www-form-urlencoded",
        }
      ),
      null!,
      null!
    );

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toBe(
      "Invalid client_assertion_type parameter, must be urn:ietf:params:oauth:client-assertion-type:jwt-bearer"
    );
  });

  it("should return a 400 error for invalid client-assertion", async () => {
    const response = await handler(
      createApiGatewayEvent(
        "POST",
        [
          `client_assertion_type=${encodeURIComponent("urn:ietf:params:oauth:client-assertion-type:jwt-bearer")}`,
          `code=${AUTH_CODE}`,
          `grant_type=${"authorization_code"}`,
          `client_assertion=${"notValid.ClientAssertion"}`,
          `client_id=${orchToAuthExpectedClientId}`,
          `redirect_uri=""`,
        ].join("&"),
        {},
        {
          "Content-Type": "x-www-form-urlencoded",
        }
      ),
      null!,
      null!
    );

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toBe(
      "Unexpected number of Base64URL parts, must be three"
    );
  });
});

async function setUpAuthCode(): Promise<void> {
  await addAuthCodeStore(createAuthCodeStoreInput(AUTH_CODE));
}

async function generateQuery(
  clientAssertionType: string,
  authCode: string,
  grantType: string,
  clientId: string,
  privateKey: KeyObject
): Promise<string> {
  const jwt = await new SignJWT()
    .setSubject(clientId)
    .setProtectedHeader({ alg: "ES256", kid: "test-key-id" })
    .sign(privateKey);
  return [
    `client_assertion_type=${encodeURIComponent(clientAssertionType)}`,
    `code=${authCode}`,
    `grant_type=${grantType}`,
    `client_assertion=${jwt}`,
    `client_id=${clientId}`,
    `redirect_uri=""`,
  ].join("&");
}
