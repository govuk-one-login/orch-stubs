import { createPublicKey, randomUUID } from "crypto";
import localParams from "../parameters.json" assert { type: "json" };
import { CompactEncrypt, importPKCS8, SignJWT } from "jose";

const publicEncryptionKey = createPublicKey(
  localParams.Parameters.IPV_AUTHORIZE_PRIVATE_ENCRYPTION_KEY
);
const privateSigningPem = localParams.Parameters.DUMMY_PRIVATE_SIGNING_KEY;

const main = async () => {
  const privateSigningKey = await importPKCS8(privateSigningPem, "ES256");

  const signedJwt = await new SignJWT({
    sub: "urn:fdc:gov.uk:2022:Js1eJ0BbwPJEZIVV8DtXeLs-BSWHhKL-qHOjpnY7R-w",
    response_type: "code",
    govuk_signin_journey_id: "jAWCpUMvz6x7kTJTXTgC2OeldWM",
    aud: "https://ipvstub.oidc.local.account.gov.uk",
    vtr: ["P2"],
    scope: "openid email phone",
    state: randomUUID(),
    jti: randomUUID(),
  })
    .setProtectedHeader({ alg: "ES256" })
    .sign(privateSigningKey);

  const requestObject = await new CompactEncrypt(Buffer.from(signedJwt))
    .setProtectedHeader({ alg: "RSA-OAEP-256", enc: "A256GCM" })
    .encrypt(publicEncryptionKey);
  return requestObject;
};

main().then((r) => console.log("Here is the request object: " + r));
