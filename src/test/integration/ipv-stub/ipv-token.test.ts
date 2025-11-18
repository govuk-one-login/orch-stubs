import { exportPKCS8, importPKCS8, SignJWT } from "jose";
import { IpvTokenResponse } from "../../../main/ipv-stub/interfaces/ipv-token-response-interface.ts";
import {
  getUserIdentity,
  putUserIdentity,
  resetUserIdentityTable,
} from "./helper/dynamo-helper.ts";
import { USER_IDENTITY } from "../../../main/ipv-stub/data/ipv-dummy-constants.ts";
import localParams from "../../../../parameters.json";
import { generateKeyPairSync } from "crypto";
import { handler } from "../../../main/ipv-stub/ipv-token.ts";
import { createApiGatewayEvent } from "../util.ts";

describe("IPV Token", () => {
  const AUTH_CODE = "12345";

  beforeEach(async () => {
    await setUpUserIdentity();
  });

  afterEach(async () => {
    await resetUserIdentityTable();
  });

  it("should return 200 for valid POST request and update Dynamo", async () => {
    const response = await handler(
      createApiGatewayEvent(
        "POST",
        await generateQuery(
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          AUTH_CODE,
          "authorization_code",
          "authOrchestrator",
          localParams.Parameters.DUMMY_PRIVATE_SIGNING_KEY
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
    const tokenResponse: IpvTokenResponse = JSON.parse(response.body);
    expect(typeof tokenResponse.access_token).toBe("string");
    expect(tokenResponse.token_type).toBe("Bearer");
    const actualUserIdentity = await getUserIdentity(
      tokenResponse.access_token
    );
    expect(actualUserIdentity).toMatchObject(USER_IDENTITY);
  });

  it("should return 405 for GET request", async () => {
    const response = await handler(
      createApiGatewayEvent(
        "GET",
        "",
        {},
        {
          "Content-Type": "x-www-form-urlencoded",
        }
      ),
      null!,
      null!
    );
    expect(response.statusCode).toBe(405);
    expect(JSON.parse(response.body).message).toStrictEqual(
      "Method GET not allowed"
    );
  });

  it("should return 400 for request with missing body", async () => {
    const response = await handler(
      createApiGatewayEvent(
        "POST",
        null!,
        {},
        {
          "Content-Type": "x-www-form-urlencoded",
        }
      ),
      null!,
      null!
    );
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toStrictEqual(
      "Missing request body"
    );
  });

  it("should return 400 for request with unexpected grant type", async () => {
    const response = await handler(
      createApiGatewayEvent(
        "POST",
        await generateQuery(
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          AUTH_CODE,
          "invalid",
          "authOrchestrator",
          localParams.Parameters.DUMMY_PRIVATE_SIGNING_KEY
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
    expect(JSON.parse(response.body)).toStrictEqual({
      message: "Unexpected grant type (invalid) in query",
    });
  });

  it("should return 400 for request with unexpected client assertion type", async () => {
    const response = await handler(
      createApiGatewayEvent(
        "POST",
        await generateQuery(
          "invalid",
          AUTH_CODE,
          "authorization_code",
          "authOrchestrator",
          localParams.Parameters.DUMMY_PRIVATE_SIGNING_KEY
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
    expect(JSON.parse(response.body)).toStrictEqual({
      message: "Unexpected client assertion type (invalid) in query",
    });
  });

  it("should return 400 for request with missing auth code", async () => {
    const response = await handler(
      createApiGatewayEvent(
        "POST",
        await generateQuery(
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          "",
          "authorization_code",
          "authOrchestrator",
          localParams.Parameters.DUMMY_PRIVATE_SIGNING_KEY
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
  });

  it("should return 400 for request with no client ID", async () => {
    const response = await handler(
      createApiGatewayEvent(
        "POST",
        await generateQuery(
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          AUTH_CODE,
          "authorization_code",
          "",
          localParams.Parameters.DUMMY_PRIVATE_SIGNING_KEY
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
  });

  it("should return 500 request with invalid client assertion signature", async () => {
    const wrongSigningKey = generateKeyPairSync("ec", {
      namedCurve: "P-256",
    }).privateKey;
    const wrongKeyPem = await exportPKCS8(wrongSigningKey);

    const response = await handler(
      createApiGatewayEvent(
        "POST",
        await generateQuery(
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          AUTH_CODE,
          "authorization_code",
          "authOrchestrator",
          wrongKeyPem
        ),
        {},
        {
          "Content-Type": "x-www-form-urlencoded",
        }
      ),
      null!,
      null!
    );

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      message: "Invalid request",
    });
  });

  async function generateQuery(
    clientAssertionType: string,
    authCode: string,
    grantType: string,
    clientId: string,
    privateKey: string
  ): Promise<string> {
    const key = await importPKCS8(privateKey, "ES256");
    const jwt = await new SignJWT({})
      .setProtectedHeader({ alg: "ES256", kid: "test-key-id" })
      .sign(key);
    return [
      `client_assertion_type=${encodeURIComponent(clientAssertionType)}`,
      `code=${authCode}`,
      `grant_type=${grantType}`,
      `client_assertion=${jwt}`,
      `client_id=${clientId}`,
    ].join("&");
  }

  async function setUpUserIdentity(): Promise<void> {
    await putUserIdentity(AUTH_CODE, USER_IDENTITY);
  }
});
