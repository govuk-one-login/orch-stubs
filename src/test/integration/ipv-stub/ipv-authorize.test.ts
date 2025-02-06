import {
  getState,
  getUserIdentity,
  resetUserIdentityTable,
} from "./helper/dynamo-helper";
import { CompactEncrypt, importPKCS8, SignJWT } from "jose";
import formConfig from "../../../main/ipv-stub/config/config";
import localParams from "../../../../parameters.json";
import { createPublicKey, randomUUID } from "crypto";
import { handler } from "./../../../main/ipv-stub/ipv-authorize";
import { createApiGatewayEvent } from "../util";
import { Context } from "aws-lambda";

const STATE = "test-state";
const AUTH_CODE = "test-auth-code";

beforeEach(resetUserIdentityTable);

describe("IPV Authorize", () => {
  it("should return 200 for valid GET request and update Dynamo", async () => {
    const response = await handler(
      createApiGatewayEvent(
        "GET",
        "",
        {
          request: await generateJwe(),
          client_id: "authOrchestrator",
        },
        {}
      ),
      {} as Context,
      () => {}
    );
    expect(response.statusCode).toBe(200);
    const htmlRegex =
      /<input type="hidden" name="authCode" value=(?<authCode>[A-Za-z0-9+/\-_]+)>/;
    expect(response.body).toMatch(htmlRegex);
    const { authCode } = htmlRegex.exec(response.body)!.groups!;
    const state = await getState(authCode);
    expect(state).toBe(STATE);
  });

  it("should return 302 for valid POST request and update Dynamo", async () => {
    const response = await handler(
      createApiGatewayEvent("POST", generateFormBody(), {}, {}),
      {} as Context,
      () => {}
    );
    expect(response.statusCode).toBe(302);
    expect(response.headers.Location).toBe(
      `https://oidc.local.account.gov.uk/ipv-callback?code=${AUTH_CODE}`
    );

    const expectedUserIdentity = {
      sub: formConfig.coreIdentityJWT.sub,
      vot: formConfig.coreIdentityJWT.vot,
      vtm: formConfig.coreIdentityJWT.vtm,
      "https://vocab.account.gov.uk/v1/coreIdentity":
        formConfig.coreIdentityJWT.vc,
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
    const response = await handler(
      createApiGatewayEvent("GET", "", null!, {}),
      {} as Context,
      () => {}
    );
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toBe(
      "Query string parameters are null"
    );
  });

  it("should return 500 if decryption fails", async () => {
    const invalidJwt = "invalid.jwt.token";
    const response = await handler(
      createApiGatewayEvent("GET", "", { request: invalidJwt }, {}),
      {} as Context,
      () => {}
    );
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).message).toBe(
      "Encountered an unhandled exception: Invalid Compact JWE"
    );
  });

  it("should return 500 if signature validation fails", async () => {
    const jwtWithInvalidSignature =
      "eyJhbGciOiJSU0EtT0FFUC0yNTYiLCJlbmMiOiJBMjU2R0NNIn0.K2vMXxOyK8kcUXBTAzHaD08o0wBoVv3NgMudmm-eBuyZwfwhL0TT3ddRxwEj8Lck5vDjX4K4nkw3gppPyNTdY6rOxp5ERgwn1g4-l1Li8oh2vX1FtE8qjmpICBQpNOxgKGwQvqWmTGMPL0M2G0wxmyYqcnLybPPFobJRbptyr7y7shLyjqwnRb5KL_qLCDWakZEPeUd-HpfTuHh8rugYRekYiczw1r7XEkhpeQAOIywvIdAoG_QnHghNtxxQ_EOkrwfCgB5stwxAGK6kMOlmUvLQruebVSjM1dbBFZ9JGGEJJKXhq7KQzcNGiMPvvQYg5c_danDCPTSJ06OCY-GjsA.7IZCnz9mQz-ZoRS3.dJekXeHnZniLU52s9P2xloFqJIHCmw5ryUsYZLfqv-ZTjRzqf_vRhFZRGySn8C2Ks_xzbNx2e3RTY9YXQxdh1YgeKAJclYQZpQcYqqJJ7Sw7FBLY2ej5oj9eEZp_QZBilLFUYzF6NhBg7eVEENjH0yWKxQ-_oN12v7OSywu2q6ykVlY6gKbi3dhn-l-XHjNYfapGopW1kjfScjnkVCpoZi_8XDwbzh7MqPSNKuVOJUt87-965gKq4bfmb_hYcPrzsQPhdwGZxAjPVI5Thj-3FBYvCxIvY5zWid7BwgAv0Rt0ZgupNkKpLGnH3jJxboQm7-GV-5enrloavWc3Uyc8P3N5oPG2AB9dBkbSejuuogHTaCKszAV0QvAETqRfD_svcNV75713rw6tljZr_Rqji20i-ZAu_LoiMaP2s-h8f4GlzadBhIqr86VN6Jnes2Q4UEZvfGRNJZDfBWddHwxQyP_Oc_KHYxg3D9JFf0MeAvbY8267xadPapudBaEqLLEJs5oOJZr5E_72p-IsrIu4xI5VhX4t7_xUEvu7tkEwtbgHzLr9gW_FMlfKRs-scY770GBSf0VQAnODvwadhZLIAnt9HI3WNfymgItUGLSFgVZI3I0CtPHVMexCK2Qkj4Z9R2Eq2rCQXFaM5cFInXnLSuG3exGxh5lryPZwDk9rj8c3kOYUZvqm9yKaz0eGrXgNPbmEnnt-AMwoUk6rvn_X8IhD6asGRtmVOxt-B7NY0hfCtF8WqfftLHnRz4SYv90Iq9_QfndX_uyuLDZ9B_ZHQEbWF8b76ITYuLcWLSNCFZgZguXWdcjvAeqXd4PjhXyJCAnXk7NNdDY3f34aNyLNstUdjXcwgtpxF5VVwGEkFY6cFbJALufwKVbXkqi1rSOHcPtvT5ZSfljByJ4zX5mV1Mm2-KdVAGklA91-sLnglD_ZqLDeurHjxzrDIIsJbNQoZzG6eG3dHtFdA_ZDn5JIc1orDKEg5hv9SbbzhI3pz-vLmXQbnGV6wJJjcJcR5NEHX9mqM2MZOEl8XH2K0nt0Q-UUzZa88IfGOapQLBOYx83L-4QHf_3M7uWhS-k0LtzozD3R1sPDtwswFbz-gF_PXKcdSbYxyB2LSBGKcgyrlu-kqlNl1p_r9YABKHXloRcVmItYcwGr6aGCWQ410DtU4yl3y0EKMxPMXJHKC-AtmxGjAYTqnYgz2Q71yDY1mIFvdDgYUQbXKvkf793OEMrVi_C35ATOhf1j13TNssz2Ggc_t6F9Ts8RG1ohCusW51vf8-3Ju6sCJH-5RF2sHYp1uVDHRGU-t9N9MJ-m_WKxsnGbKYr0-G-c94wBDiFqwibqFOWF84v_ny2231WZb41_RoNoEA84aIB51QwABpuTDSAvGzW302ujn2aGpidSJI7xFo6snyLaRHl8ZogXNGc49rOl3byq5JhCdThIBSDU_C71X5-kKgtc2crMh0q_fyd7YmzDrMz3CLNjypjg4s95clTxXbjnf6h9aOxrzed5HxRM-D27ZySKUoYwZfvGOflw9N2yNu_5u8bYlkl1TgE-hni9_NNy8cmlZKgPe4gFUnAaqPc6SMyYRFo39ZyQ1LUSybl9AlI6V71ojCXoCO9UVVaKvcRKtNctNmiNiKpNYg.Jc8AISyhhv5ZWX4WVuPdMA";
    const response = await handler(
      createApiGatewayEvent(
        "GET",
        "",
        { request: jwtWithInvalidSignature },
        {}
      ),
      {} as Context,
      () => {}
    );

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).message).toEqual(
      "Signature verification failed"
    );
  });
});

async function generateJwt(): Promise<string> {
  const key = await importPKCS8(
    localParams.Parameters.DUMMY_PRIVATE_SIGNING_KEY,
    "ES256"
  );
  return await new SignJWT({
    sub: "urn:fdc:gov.uk:2022:Js1eJ0BbwPJEZIVV8DtXeLs-BSWHhKL-qHOjpnY7R-w",
    response_type: "code",
    govuk_signin_journey_id: "jAWCpUMvz6x7kTJTXTgC2OeldWM",
    aud: "https://ipvstub.oidc.local.account.gov.uk",
    vtr: ["P2"],
    scope: "openid email phone",
    state: STATE,
    jti: randomUUID(),
    claims: {
      userinfo: {
        "https://vocab.account.gov.uk/v1/storageAccessToken": {
          values: "storageAccessToken",
        },
        "https://vocab.account.gov.uk/v1/passport": {
          essential: true,
        },
        "https://vocab.account.gov.uk/v1/socialSecurityRecord": {
          essential: true,
        },
        "https://vocab.account.gov.uk/v1/drivingPermit": {
          essential: true,
        },
        "https://vocab.account.gov.uk/v1/coreIdentityJWT": {
          essential: true,
        },
        "https://vocab.account.gov.uk/v1/address": {
          essential: true,
        },
        "https://vocab.account.gov.uk/v1/returnCode": {
          essential: true,
        },
      },
    },
  })
    .setProtectedHeader({ alg: "ES256", kid: "test-key-id" })
    .sign(key);
}

async function generateJwe(): Promise<string> {
  const publicEncryptionKey = createPublicKey(
    localParams.Parameters.IPV_AUTHORIZE_PRIVATE_ENCRYPTION_KEY
  );
  const jwt = await generateJwt();
  return new CompactEncrypt(new TextEncoder().encode(jwt))
    .setProtectedHeader({ cty: "JWT", enc: "A256GCM", alg: "RSA-OAEP-256" })
    .encrypt(publicEncryptionKey);
}

function generateFormBody(): string {
  return new URLSearchParams({
    authCode: AUTH_CODE,
    sub: formConfig.coreIdentityJWT.sub,
    vot: formConfig.coreIdentityJWT.vot,
    vtm: formConfig.coreIdentityJWT.vtm,
    identity_claim: JSON.stringify(formConfig.coreIdentityJWT.vc),
    address_claim: JSON.stringify(formConfig.address),
    passport_claim: JSON.stringify(formConfig.passport),
    driving_permit_claim: JSON.stringify(formConfig.drivingPermit),
    nino_claim: JSON.stringify(formConfig.socialSecurityRecord),
    return_code_claim: JSON.stringify(formConfig.returnCode),
  } as Record<string, string>).toString();
}
