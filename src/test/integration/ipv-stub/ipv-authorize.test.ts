import supertest from "supertest";
import {
  createUserIdentityTable,
  getState,
  getUserIdentity,
  resetUserIdentityTable,
} from "./helper/dynamo-helper";
import { getLocalEndpoint } from "../../../main/aws-config";
import { CompactEncrypt, importPKCS8, importSPKI, SignJWT } from "jose";
import formConfig from "../../../main/ipv-stub/config/config";
import { USER_IDENTITY } from "../../../main/ipv-stub/data/ipv-dummy-constants";
import {
  IPV_AUTHORIZE_PUBLIC_ENCRYPTION_KEY,
  ORCH_PRIVATE_SIGNING_KEY,
} from "./data/keys";

// we need this to accept self-signed-certificates in nodejs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
process.env.NODE_TLS_ACCEPT_UNTRUSTED_CERTIFICATES_THIS_IS_INSECURE = "1";

const STATE = "test-state";
const AUTH_CODE = "test-auth-code";

beforeAll(createUserIdentityTable);
afterEach(resetUserIdentityTable);

describe("IPV Authorize", () => {
  const api = supertest(getLocalEndpoint(3001));

  it("should return 200 for valid GET request and update Dynamo", async () => {
    const response = await api.get(`/authorize?request=${await generateJwe()}`);
    expect(response.statusCode).toBe(200);
    const htmlRegex =
      /<input type="hidden" name="authCode" value=(?<authCode>[A-Za-z0-9+/\-_]+)>/;
    expect(response.text).toMatch(htmlRegex);
    const { authCode } = htmlRegex.exec(response.text)!.groups!;
    const state = await getState(authCode);
    expect(state).toBe(STATE);
  });

  it("should return 302 for valid POST request and update Dynamo", async () => {
    const response = await api.post("/authorize").send(generateFormBody());
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(
      `https://oidc.local.account.gov.uk/ipv-callback?code=${AUTH_CODE}`
    );

    const expectedUserIdentity = {
      sub: formConfig.coreIdentityJWT.sub,
      vot: formConfig.coreIdentityJWT.vot,
      vtm: formConfig.coreIdentityJWT.vtm,
      "https://vocab.account.gov.uk/v1/credentialJWT":
        USER_IDENTITY["https://vocab.account.gov.uk/v1/credentialJWT"],
      "https://vocab.account.gov.uk/v1/coreIdentity":
        formConfig.coreIdentityJWT.vc.credentialSubject,
      "https://vocab.account.gov.uk/v1/address": formConfig.address,
      "https://vocab.account.gov.uk/v1/drivingPermit": formConfig.drivingPermit,
      "https://vocab.account.gov.uk/v1/socialSecurityRecord":
        formConfig.socialSecurityRecord,
      "https://vocab.account.gov.uk/v1/passport": formConfig.passport,
      "https://vocab.account.gov.uk/v1/returnCode": formConfig.returnCode,
    };
    const actualUserIdentity = await getUserIdentity(AUTH_CODE);
    expect(actualUserIdentity).toMatchObject(expectedUserIdentity);
  });

  it("should return 400 if token is not present in authorize request", async () => {
    const response = await api.get("/authorize");
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Query string parameters are null");
  });

  it("should return 500 if decryption fails", async () => {
    const invalidJwt = "invalid.jwt.token";
    const response = await api.get(`/authorize?request=${invalidJwt}`);
    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe(
      "Encountered an unhandled exception: Invalid Compact JWE"
    );
  });
});

async function generateJwt(): Promise<string> {
  const key = await importPKCS8(ORCH_PRIVATE_SIGNING_KEY, "ES256");
  return await new SignJWT({ ...USER_IDENTITY, state: STATE })
    .setProtectedHeader({ alg: "ES256" })
    .sign(key);
}

async function generateJwe(): Promise<string> {
  const key = await importSPKI(
    IPV_AUTHORIZE_PUBLIC_ENCRYPTION_KEY,
    "RSA-OAEP-256"
  );
  const jwt = await generateJwt();
  return new CompactEncrypt(new TextEncoder().encode(jwt))
    .setProtectedHeader({ cty: "JWT", enc: "A256GCM", alg: "RSA-OAEP-256" })
    .encrypt(key);
}

function generateFormBody(): string {
  return new URLSearchParams({
    authCode: AUTH_CODE,
    identity_claim: JSON.stringify(formConfig.coreIdentityJWT),
    address_claim: JSON.stringify(formConfig.address),
    passport_claim: JSON.stringify(formConfig.passport),
    driving_permit_claim: JSON.stringify(formConfig.drivingPermit),
    nino_claim: JSON.stringify(formConfig.socialSecurityRecord),
    return_code_claim: JSON.stringify(formConfig.returnCode),
    continue: "continue",
  } as Record<string, string>).toString();
}
