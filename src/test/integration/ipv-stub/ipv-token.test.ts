import supertest from "supertest";
import { importPKCS8, SignJWT } from "jose";
import { IpvTokenResponse } from "../../../main/ipv-stub/interfaces/ipv-token-response-interface";
import {
  createUserIdentityTable,
  getUserIdentity,
  putUserIdentity,
  resetUserIdentityTable,
} from "./helper/dynamo-helper";
import { getLocalEndpoint } from "../../../main/aws-config";
import { USER_IDENTITY } from "../../../main/ipv-stub/data/ipv-dummy-constants";
import {
  ORCH_PRIVATE_SIGNING_KEY,
  ORCH_PRIVATE_SIGNING_KEY_INVALID,
} from "./data/keys";

const AUTH_CODE = "12345";

beforeEach(async () => {
  await createUserIdentityTable();
  await setUpUserIdentity();
});
afterEach(resetUserIdentityTable);

describe("IPV Token", () => {
  const api = supertest(getLocalEndpoint(false, 3001));

  it("should return 200 for valid POST request and update Dynamo", async () => {
    const response = await api
      .post("/token")
      .send(
        await generateQuery(
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          AUTH_CODE,
          "authorization_code",
          "authOrchestrator",
          ORCH_PRIVATE_SIGNING_KEY
        )
      )
      .expect("Content-Type", /json/);
    expect(response.statusCode).toBe(200);
    const tokenResponse = response.body as IpvTokenResponse;
    expect(typeof tokenResponse.access_token).toBe("string");
    expect(tokenResponse.token_type).toBe("Bearer");
    const actualUserIdentity = await getUserIdentity(
      tokenResponse.access_token
    );
    expect(actualUserIdentity).toMatchObject(USER_IDENTITY);
  });

  it("should return 405 for GET request", async () => {
    const response = await api.get("/token").expect("Content-Type", /json/);
    expect(response.statusCode).toBe(405);
    expect(response.body.message).toBe("Method GET not allowed");
  });

  it("should return 400 for request with missing body", async () => {
    const response = await api
      .post("/token")
      .set("Content-Type", "application/x-www-form-urlencoded")
      .send();
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Missing request body");
  });

  it("should return 400 for request with unexpected grant type", async () => {
    const response = await api
      .post("/token")
      .send(
        await generateQuery(
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          AUTH_CODE,
          "invalid",
          "authOrchestrator",
          ORCH_PRIVATE_SIGNING_KEY
        )
      )
      .expect("Content-Type", /json/);
    expect(response.statusCode).toBe(400);
  });

  it("should return 400 for request with unexpected client assertion type", async () => {
    const response = await api
      .post("/token")
      .send(
        await generateQuery(
          "invalid",
          AUTH_CODE,
          "authorization_code",
          "authOrchestrator",
          ORCH_PRIVATE_SIGNING_KEY
        )
      )
      .expect("Content-Type", /json/);
    expect(response.statusCode).toBe(400);
  });

  it("should return 400 for request with missing auth code", async () => {
    const response = await api
      .post("/token")
      .send(
        await generateQuery(
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          "",
          "authorization_code",
          "authOrchestrator",
          ORCH_PRIVATE_SIGNING_KEY
        )
      )
      .expect("Content-Type", /json/);
    expect(response.statusCode).toBe(400);
  });

  it("should return 400 for request with client ID", async () => {
    const response = await api
      .post("/token")
      .send(
        await generateQuery(
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          AUTH_CODE,
          "authorization_code",
          "",
          ORCH_PRIVATE_SIGNING_KEY
        )
      )
      .expect("Content-Type", /json/);
    expect(response.statusCode).toBe(400);
  });

  it("should return 500 request with invalid client assertion", async () => {
    const response = await api
      .post("/token")
      .send(
        await generateQuery(
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          AUTH_CODE,
          "authorization_code",
          "authOrchestrator",
          ORCH_PRIVATE_SIGNING_KEY_INVALID
        )
      )
      .expect("Content-Type", /json/);
    expect(response.statusCode).toBe(500);
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
    .setProtectedHeader({ alg: "ES256" })
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
