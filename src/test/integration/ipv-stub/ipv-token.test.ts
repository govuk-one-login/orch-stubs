import supertest from "supertest";
import { SignJWT } from "jose";
import { createPrivateKey } from "node:crypto";
import { IpvTokenResponse } from "../../../main/ipv-stub/entity/ipv-token-response";

const privateKeyValid =
  "-----BEGIN EC PRIVATE KEY-----\n" +
  "MHcCAQEEIMxcAPN6y5qDH+71YDJzd+/p2kAnZrvgWCxEzf7gTai0oAoGCCqGSM49\n" +
  "AwEHoUQDQgAEv7fcU+ExySNFY/ymqqK7T3Mf/K5mIV6J/Uaq4jvlJLqLy7rxJfpm\n" +
  "S7JZ2ReRpb3QVYsfMGRKkPrr8i0jFD/8KQ==\n" +
  "-----END EC PRIVATE KEY-----";
const privateKeyInvalid =
  "-----BEGIN EC PRIVATE KEY-----\n" +
  "MHcCAQEEID2mooNAXitnYSQ1utmkmxuX8MS9KNiX9huvAXV51iMIoAoGCCqGSM49\n" +
  "AwEHoUQDQgAEwD7jhGE3cciRJsAl7WAo27P9HrRAGPcWhowyEUixHK0hyLYTb+eg\n" +
  "b9ahVDmXI4LwTYZART3D096AdvX6VU6rbQ==\n" +
  "-----END EC PRIVATE KEY-----";

describe("IPV Authorize", () => {
  const api = supertest("http://127.0.0.1:3000/");

  it("should return 302 for valid POST request", async () => {
    const response = await api
      .post("/token")
      .send(
        await generateQuery(
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          "validAuthCode",
          "authorization_code",
          "https://api.identity/token",
          "https://api.identity",
          "authOrchestrator",
          privateKeyValid
        )
      );
    expect(response.statusCode).toBe(302);
    const tokenResponse = response.body as IpvTokenResponse;
    expect(typeof tokenResponse.access_token).toBe("string");
    expect(tokenResponse.token_type).toBe("Bearer");
  });

  it("should return 405 for GET request", async () => {
    const response = await api.get("/token");
    expect(response.statusCode).toBe(405);
    expect(response.body.message).toBe("Method not allowed");
  });

  it("should return 400 request with missing body", async () => {
    const response = await api.post("/token");
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Method not allowed");
  });

  it("should return 400 request with unexpected grant type", async () => {
    const response = await api
      .post("/token")
      .send(
        await generateQuery(
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          "validAuthCode",
          "invalid",
          "https://api.identity/token",
          "https://api.identity",
          "authOrchestrator",
          privateKeyValid
        )
      );
    expect(response.statusCode).toBe(200);
  });

  it("should return 400 request with unexpected client assertion type", async () => {
    const response = await api
      .post("/token")
      .send(
        await generateQuery(
          "invalid",
          "validAuthCode",
          "authorization_code",
          "https://api.identity/token",
          "https://api.identity",
          "authOrchestrator",
          privateKeyValid
        )
      );
    expect(response.statusCode).toBe(200);
  });

  it("should return 400 request with missing auth code", async () => {
    const response = await api
      .post("/token")
      .send(
        await generateQuery(
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          "",
          "authorization_code",
          "https://api.identity/token",
          "https://api.identity",
          "authOrchestrator",
          privateKeyValid
        )
      );
    expect(response.statusCode).toBe(200);
  });

  it("should return 500 request with invalid client assertion", async () => {
    const response = await api
      .post("/token")
      .send(
        await generateQuery(
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          "validAuthCode",
          "authorization_code",
          "https://api.identity/token",
          "https://api.identity",
          "authOrchestrator",
          privateKeyInvalid
        )
      );
    expect(response.statusCode).toBe(200);
  });
});

async function generateQuery(
  clientAssertionType: string,
  authCode: string,
  grantType: string,
  resource: string,
  audience: string,
  clientId: string,
  privateKey: string
): Promise<string> {
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256" })
    .setAudience(audience)
    .setSubject(clientId)
    .setIssuer(clientId)
    .sign(createPrivateKey(privateKey));
  return [
    `client_assertion_type=${encodeURIComponent(clientAssertionType)}`,
    `code=${authCode}`,
    `grant_type=${grantType}`,
    `resource=${resource}`,
    `client_assertion=${jwt}`,
    `client_id=${clientId}`,
  ].join("&");
}
