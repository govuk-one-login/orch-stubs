import supertest from "supertest";
import { SignJWT } from "jose";
import { createPrivateKey } from "node:crypto";
import { IpvTokenResponse } from "../../../main/ipv-stub/interfaces/ipv-token-response-interface";

const privateKeyValid =
  "-----BEGIN PRIVATE KEY-----\n" +
  "MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg+QT/ujb5vuKZbL6d\n" +
  "aExjhmxVjf05lihGyhAQBno0pe+hRANCAASXbFEUUtUW/dFzKX50i3ocGlSd6+NT\n" +
  "WY+WCfs7yZZfqsaYKxUaeYKIhGeouDkVCs72tot4yiYFs/jQ9dg86SUy\n" +
  "-----END PRIVATE KEY-----\n";
const privateKeyInvalid =
  "-----BEGIN PRIVATE KEY-----\n" +
  "MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgnEpemWfQ6m2Fxo6E\n" +
  "NP13NkocvvrAKHc/IWbC+jSOc/uhRANCAARcsKXyN+lhvtj4KzR1QNYqHE2OWFK8\n" +
  "W3dap/x1mO/OYN6D6f9KWLXy6+Nrnp11SB5Qj9IMUWPQUBolJLSaxhBI\n" +
  "-----END PRIVATE KEY-----\n";

describe("IPV Token", () => {
  const api = supertest("http://127.0.0.1:3000/");

  it("should return 200 for valid POST request", async () => {
    const response = await api
      .post("/token")
      .send(
        await generateQuery(
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          "12345",
          "authorization_code",
          "https://identity.none.account.gov.uk/",
          "authOrchestrator",
          "authOrchestrator",
          "authOrchestrator",
          privateKeyValid
        )
      )
      .expect("Content-Type", /json/);
    expect(response.statusCode).toBe(200);
    const tokenResponse = response.body as IpvTokenResponse;
    expect(typeof tokenResponse.access_token).toBe("string");
    expect(tokenResponse.token_type).toBe("Bearer");
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
          "12345",
          "invalid",
          "https://identity.none.account.gov.uk/",
          "authOrchestrator",
          "authOrchestrator",
          "authOrchestrator",
          privateKeyValid
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
          "12345",
          "authorization_code",
          "https://identity.none.account.gov.uk/",
          "authOrchestrator",
          "authOrchestrator",
          "authOrchestrator",
          privateKeyValid
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
          "https://identity.none.account.gov.uk/",
          "authOrchestrator",
          "authOrchestrator",
          "authOrchestrator",
          privateKeyValid
        )
      )
      .expect("Content-Type", /json/);
    expect(response.statusCode).toBe(400);
  });

  it("should return 400 for request with incorrect audience", async () => {
    const response = await api
      .post("/token")
      .send(
        await generateQuery(
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          "",
          "authorization_code",
          "incorrectAudience",
          "authOrchestrator",
          "authOrchestrator",
          "authOrchestrator",
          privateKeyValid
        )
      )
      .expect("Content-Type", /json/);
    expect(response.statusCode).toBe(400);
  });

  it("should return 400 for request with incorrect subject", async () => {
    const response = await api
      .post("/token")
      .send(
        await generateQuery(
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          "",
          "authorization_code",
          "https://identity.none.account.gov.uk/",
          "incorrectSubject",
          "authOrchestrator",
          "authOrchestrator",
          privateKeyValid
        )
      )
      .expect("Content-Type", /json/);
    expect(response.statusCode).toBe(400);
  });

  it("should return 400 for request incorrect issuer", async () => {
    const response = await api
      .post("/token")
      .send(
        await generateQuery(
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          "",
          "authorization_code",
          "https://identity.none.account.gov.uk/",
          "authOrchestrator",
          "incorrectIssuer",
          "authOrchestrator",
          privateKeyValid
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
          "",
          "authorization_code",
          "https://identity.none.account.gov.uk/",
          "authOrchestrator",
          "authOrchestrator",
          "incorrectClientId",
          privateKeyValid
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
          "12345",
          "authorization_code",
          "https://identity.none.account.gov.uk/",
          "authOrchestrator",
          "authOrchestrator",
          "authOrchestrator",
          privateKeyInvalid
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
  audience: string,
  subject: string,
  issuer: string,
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
    `client_assertion=${jwt}`,
    `client_id=${clientId}`,
  ].join("&");
}
