import { createApiGatewayEvent } from "../util";
import { handler } from "../../../main/auth-stub/auth-authorize";
import * as jose from "jose";
import { Claims } from "src/main/auth-stub/helpers/claims-config";
import { mockEnvVariableSetup } from "./helpers/test-setup";
import * as decryptionHelper from "../../../main/auth-stub/helpers/decryption-helper";
import {
  addUserProfile,
  resetAuthCodeStore,
  resetUserProfile,
} from "./helpers/dynamo-helper";
import { createUserPofile } from "../../../main/auth-stub/test-helper/mock-token-data-helper";

describe("Auth Authorize", () => {
  const EMAIL = "dummy.email@mail.com";

  beforeEach(async () => {
    const privateKey = await getPrivateKey();
    const jwt = await createJwt(createMockClaims(), privateKey);
    mockEnvVariableSetup();
    jest.spyOn(decryptionHelper, "decrypt").mockResolvedValue(jwt);
    await addUserProfile(createUserPofile(EMAIL));
  });

  afterEach(async () => {
    await resetAuthCodeStore();
    await resetUserProfile();
  });

  it("should return 200 for valid GET request", async () => {
    const response = await handler(
      createApiGatewayEvent("GET", "", generateQueryParams(), {
        "Content-Type": "x-www-form-urlencoded",
      }),
      null!,
      null!
    );

    expect(response.statusCode).toBe(200);
  });

  it("should return a 400 error when query parameters are invalid for GET request", async () => {
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

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toBe(
      "Missing request in query parameters"
    );
  });

  it("should return 302 for valid POST request and update Dynamo", async () => {
    const response = await handler(
      createApiGatewayEvent(
        "POST",
        generateFormBodyAuthRequestPost(),
        {},
        {
          "Content-Type": "x-www-form-urlencoded",
        }
      ),
      null!,
      null!
    );

    expect(response.statusCode).toBe(302);
    expect(JSON.parse(response.body).message).toContain(
      "Redirecting to https://oidc.local.account.gov.uk/orchestration-redirect?code="
    );
  });

  async function getPrivateKey(): Promise<jose.KeyLike> {
    const key = await jose.importPKCS8(
      "-----BEGIN PRIVATE KEY-----MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg7KK6gFv7hs2DImXpBaaD1ytDX0MJdh/pTK5LDyUzckWhRANCAASfwe9k/m6YBFQtP6QWUkwL52Ouu6PiOd9DR3OsC3LRgoXg09H9ZXZCukJEpDIHBsmTt1wZ9bUelp8fvz5PxsL1-----END PRIVATE KEY-----",
      "ES256"
    );
    return key;
  }

  function generateFormBodyAuthRequestPost(): string {
    return new URLSearchParams({
      authRequest: JSON.stringify(generateFormBodyPost()),
    }).toString();
  }

  function generateFormBodyPost(): Record<string, string> {
    return {
      clientId: "orchestrationAuth",
      responseType: "code",
      email: EMAIL,
      request: "testJWE",
      passwordResetTime: "10",
      sectorIdentifier: "test",
      claims: JSON.stringify({
        claim: "testClaim",
      }),
    } as Record<string, string>;
  }

  function generateQueryParams(): Record<string, string> {
    return {
      client_id: "orchestrationAuth",
      response_type: "code",
      email: EMAIL,
      request: "testJWE",
      password_reset_time: "10",
    } as Record<string, string>;
  }

  function createMockClaims(): Claims {
    const timestamp = Math.floor(new Date().getTime() / 1000);
    return {
      iss: "UNKNOWN",
      client_id: "orchestrationAuth",
      govuk_signin_journey_id: "QOFzoB3o-9gGplMgdT1dJfH4vaI",
      aud: "testURL",
      service_type: "MANDATORY",
      nbf: timestamp,
      cookie_consent_shared: true,
      state: "WLUNPYv0RPdVjhBsG4QMHYYMhGaOc8X-t83Y1XsVh1w",
      redirect_uri: "UNKNOWN",
      exp: timestamp + 1000,
      iat: timestamp,
      client_name: "di-auth-stub-relying-party-sandpit",
      is_one_login_service: false,
      rp_sector_host: "https://rp.sector.uri",
      jti: "fvvMWAladDtl35O_xyBTRLwwojA",
      rp_redirect_uri: "https://rp.service.gov.uk/redirect/",
      rp_state: "baeb1828-131f-40ef-9574-eee677d1cdd7",
      rp_client_id: "RP_CLIENT_ID",
      previous_govuk_signin_journey_id: "a7349515-9154-4d20-b282-c42d2d35ac10",
      claim:
        '{"userinfo": {"email_verified": null, "public_subject_id": null, "email": null}}',
      authenticated: false,
      current_credential_strength: "MEDIUM_LEVEL",
      requested_credential_strength: "Cl.Cm",
      scope: "openid",
    };
  }

  async function createJwt(
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    jwtObject: any,
    privateKey: jose.KeyLike
  ): Promise<string> {
    const jwt = await new jose.SignJWT(jwtObject)
      .setProtectedHeader({ alg: "ES256" })
      .sign(privateKey);
    return jwt;
  }
});
