import { createApiGatewayEvent } from "../util.ts";
import { handler } from "../../../main/auth-stub/auth-authorize.ts";
import { Claims } from "../../../main/auth-stub/helpers/claims-config.ts";
import { mockEnvVariableSetup } from "./helpers/test-setup.ts";
import * as decryptionHelper from "../../../main/auth-stub/helpers/decryption-helper.ts";
import {
  addUserProfile,
  resetAuthCodeStore,
  resetUserProfile,
} from "./helpers/dynamo-helper.ts";
import { createUserPofile } from "../../../main/auth-stub/test-helper/mock-token-data-helper.ts";
import { SignJWT, importPKCS8 } from "jose";
import localParams from "../../../../parameters.json";

describe("Auth Authorize", () => {
  const EMAIL = "dummy.email@mail.com";

  beforeEach(async () => {
    mockEnvVariableSetup();
    const jwt = await createJwt(createMockClaims());
    vi.spyOn(decryptionHelper, "decrypt").mockResolvedValue(jwt);
    await addUserProfile(createUserPofile(EMAIL));
  });

  afterEach(async () => {
    await resetAuthCodeStore();
    await resetUserProfile();
    vi.clearAllMocks();
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
        createValidPostRequest(),
        {},
        {
          "Content-Type": "x-www-form-urlencoded",
        }
      ),
      null!,
      null!
    );

    expect(response.statusCode).toBe(302);
    expect(response.headers.Location).toContain(
      "https://oidc.local.account.gov.uk/orchestration-redirect?code="
    );
  });

  it("should return 302 for POST request with error and update Dynamo", async () => {
    const response = await handler(
      createApiGatewayEvent(
        "POST",
        createFormBodyWithErrorCode("test-error-code"),
        {},
        {
          "Content-Type": "x-www-form-urlencoded",
        }
      ),
      null!,
      null!
    );

    expect(response.statusCode).toBe(302);
    expect(response.headers.Location).toBe(
      "https://oidc.local.account.gov.uk/orchestration-redirect?error=test-error-code"
    );
  });

  function createValidPostRequest(): string {
    return createFormBodyWithErrorCode();
  }

  function createFormBodyWithErrorCode(error?: string): string {
    const formObject: Record<string, string> = {
      authRequest: JSON.stringify(generateAuthRequest()),
    };
    if (error) {
      formObject.error = error;
    }
    return new URLSearchParams(formObject).toString();
  }

  function generateAuthRequest(): Record<string, string> {
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
    jwtObject: any
  ): Promise<string> {
    const key = await importPKCS8(
      localParams.Parameters.DUMMY_PRIVATE_SIGNING_KEY,
      "ES256"
    );
    const jwt = await new SignJWT(jwtObject)
      .setProtectedHeader({ alg: "ES256" })
      .sign(key);
    return jwt;
  }
});
