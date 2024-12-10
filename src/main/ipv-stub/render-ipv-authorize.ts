import { JWTPayload, ProtectedHeaderParameters } from "jose";
import { renderPage } from "../template";
import config, { getTrustmarkUri } from "./config/config";

export default function renderIPVAuthorize(
  decodedHeader: ProtectedHeaderParameters,
  decodedPayload: JWTPayload,
  authCode: string
) {
  const userInfoClaims = (
    decodedPayload.claims as Record<string, Record<string, unknown>>
  ).userinfo;

  const claimKeys = Object.keys(userInfoClaims);

  const payloadWithoutClaims = Object.entries(decodedPayload).filter(
    ([key, _]) => key !== "claims"
  );

  const storageTokenClaim = (
    userInfoClaims[
      "https://vocab.account.gov.uk/v1/storageAccessToken"
    ] as Record<"values", string>
  ).values;

  return renderPage(
    "IPV Stub Form",
    `<h1 class="govuk-heading-l">IPV stub</h1>
  <h3 class="govuk-heading-s">Decrypted JAR header:</h3>
  <dl class="govuk-summary-list">
  <div class="govuk-summary-list__row">
  <dt class="govuk-summary-list__key">
  Algorithm
  </dt>
  <dd class="govuk-summary-list__value" id="alg">
  ${decodedHeader.alg}
  </dd>
  </dl>
  <h3 class="govuk-heading-s">Decrypted JAR Claims:</h3>
  <dl class="govuk-summary-list">
  ${payloadWithoutClaims
    .map(
      ([key, val]) => `<div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">
      ${key}
    </dt>
    <dd class="govuk-summary-list__value">
      ${val}
    </dd>
  </div>`
    )
    .join("\n")}
    <div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">
    Claims
  </dt>
  <dd class="govuk-summary-list__value">
  ${claimKeys.join("\n")}
</dd>
</div>
<div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">
      Storage Access Token Claim
    </dt>
    <dd class="govuk-summary-list__value">
      ${storageTokenClaim}
    </dd>
  </div>
  </dl>
  
  <h3 class="govuk-heading-s">Form:</h3>
  <p class="govuk-body">Use this form to configure the required IPV user identity response. On submit a POST request will be sent to /authorize and the IPV OAuth 2.0 flow will be initiated.</p>
  <form action="/authorize" method="post">
   <input type="hidden" name="authCode" value=${authCode}>

  <dl class="govuk-summary-list">

  <div class="govuk-summary-list__row">
  <dt class="govuk-summary-list__key">
      Subject Claim (sub)
  </dt>
  <dd class="govuk-summary-list__value" id="user-info-sub-claim">
  <input class="govuk-textarea"  id="sub" name="sub" type="text" value="${decodedPayload.sub}" readonly>
  </dd>
</div>

<div class="govuk-summary-list__row">
<dt class="govuk-summary-list__key">
Vector of trust claim (vot)
</dt>
<dd class="govuk-summary-list__value" id="user-info-vtr-claim">
<input class="govuk-textarea" id="vot" name=vot type="text" value="${decodedPayload.vtr}">
</dd>
</div>

<div class="govuk-summary-list__row">
<dt class="govuk-summary-list__key">
Trustmark claim (vtm)
</dt>
<dd class="govuk-summary-list__value" id="user-info-vtm-claim">
<input class="govuk-textarea"  id="vtm" name="vtm" type="text" value="${getTrustmarkUri()}">
</dd>
</div>

  <div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">
        CoreIdentity Claim
    </dt>
    <dd class="govuk-summary-list__value" id="user-info-core-identity-claim">
    <textarea class="govuk-textarea" rows="8" id="identity_claim" name="identity_claim" type="text" required>${JSON.stringify(config.coreIdentityJWT.vc, null, 2)}</textarea>
    </dd>
  </div>

  ${
    claimKeys.includes("https://vocab.account.gov.uk/v1/address")
      ? `<div class="govuk-summary-list__row">
  <dt class="govuk-summary-list__key">
      Address Claim
  </dt>
  <dd class="govuk-summary-list__value" id="user-info-address-claim-present">
  <textarea class="govuk-textarea" rows="8" id="address_claim" name="address_claim" type="text">${JSON.stringify(config.address, null, 2)}</textarea>
  </dd>
</div>`
      : ""
  }

  ${
    claimKeys.includes("https://vocab.account.gov.uk/v1/passport")
      ? `<div class="govuk-summary-list__row">
      <dt class="govuk-summary-list__key">
          Passport Claim
      </dt>
      <dd class="govuk-summary-list__value" id="user-info-passport-claim-present">
      <textarea class="govuk-textarea" rows="7" id="passport_claim" name="passport_claim" type="text">${JSON.stringify(config.passport, null, 2)}</textarea>
      </dd>
    </div>`
      : ""
  }

  ${
    claimKeys.includes("https://vocab.account.gov.uk/v1/drivingPermit")
      ? ` <div class="govuk-summary-list__row">
      <dt class="govuk-summary-list__key">
          Driving Permit Claim
      </dt>
      <dd class="govuk-summary-list__value" id="user-info-driving-permit-claim-present">
      <textarea class="govuk-textarea" rows="8" id="driving_permit_claim" name="driving_permit_claim" type="text">${JSON.stringify(config.drivingPermit, null, 2)}</textarea>
      </dd>
    </div>`
      : ""
  }
  
  ${
    claimKeys.includes("https://vocab.account.gov.uk/v1/socialSecurityRecord")
      ? ` <div class="govuk-summary-list__row">
      <dt class="govuk-summary-list__key">
          Social Security Record Claim
      </dt>
      <dd class="govuk-summary-list__value" id="user-info-social-security-record-claim-present">
      <textarea class="govuk-textarea" rows="5" id="nino_claim" name="nino_claim" type="text">${JSON.stringify(config.socialSecurityRecord, null, 2)}</textarea>
      </dd>
    </div>`
      : ""
  }
 
  <div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">
        Return Code Claim
    </dt>
    <dd class="govuk-summary-list__value" id="user-info-return-code-claim-present">
    <textarea class="govuk-textarea" rows="8" id="return_code_claim" name="return_code_claim" type="text">${JSON.stringify(config.returnCode, null, 2)}</textarea>
    </dd>
  </div>
    <button name="continue" value="continue" class="govuk-button">Continue</button>
  </form>`
  );
}
