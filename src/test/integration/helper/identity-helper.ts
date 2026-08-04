import { randomUUID } from "node:crypto";
import { importPKCS8, SignJWT, importSPKI, CompactEncrypt } from "jose";
import localParams from "../../../../parameters.json" with { type: "json" };

const STATE = "test-state";

export async function generateJwt(aud: string): Promise<string> {
  const key = await importPKCS8(
    localParams.Parameters.DUMMY_PRIVATE_SIGNING_KEY,
    "ES256"
  );
  return await new SignJWT({
    sub: "urn:fdc:gov.uk:2022:Js1eJ0BbwPJEZIVV8DtXeLs-BSWHhKL-qHOjpnY7R-w",
    response_type: "code",
    govuk_signin_journey_id: "jAWCpUMvz6x7kTJTXTgC2OeldWM",
    aud,
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

export async function generateJwe(aud: string): Promise<string> {
  const publicEncryptionKey = await importSPKI(
    localParams.Parameters.IPV_AUTHORIZE_PUBLIC_ENCRYPTION_KEY,
    "RSA-OAEP-256"
  );
  const jwt = await generateJwt(aud);
  return new CompactEncrypt(new TextEncoder().encode(jwt))
    .setProtectedHeader({ cty: "JWT", enc: "A256GCM", alg: "RSA-OAEP-256" })
    .encrypt(publicEncryptionKey);
}
