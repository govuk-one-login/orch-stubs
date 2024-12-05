import { JWTPayload, ProtectedHeaderParameters } from "jose";
import { renderPage } from "../template";
import config from "./config/config";

export default function renderIPVAuthorize(
  decodedHeader: ProtectedHeaderParameters,
  decodedPayload: JWTPayload,
  authCode: string
) {
  return renderPage(
    "IPV Stub Form",
    `<h1 class="govuk-heading-l">IPV stub</h1>
  <h3 class="govuk-heading-s">Decrypted JAR header:</h3>
  <dl class="govuk-summary-list">
  <div class="govuk-summary-list__row">
  <dt class="govuk-summary-list__key">
  Algorithm
  </dt>
  <dd class="govuk-summary-list__value" id="user-info-core-identity-claim-present">
  ${decodedHeader.alg}
  </dd>
  </dl>

  <dl class="govuk-summary-list">
  <div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">
      Decrypted JAR payload
    </dt>
    <dd class="govuk-summary-list__value" id="user-info-core-identity-claim">
    <textarea class="govuk-textarea" rows="10" id="identity_claim" name="identity_claim" type="text">${JSON.stringify(decodedPayload, null, 2)}</textarea>
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
        Core Identity Claim
    </dt>
    <dd class="govuk-summary-list__value" id="user-info-core-identity-claim">
    <textarea class="govuk-textarea" rows="8" id="identity_claim" name="identity_claim" type="text">${JSON.stringify(config.coreIdentityJWT, null, 2)}</textarea>
    </dd>
  </div>
  <div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">
        Address Claim
    </dt>
    <dd class="govuk-summary-list__value" id="user-info-address-claim-present">
    <textarea class="govuk-textarea" rows="8" id="address_claim" name="address_claim" type="text">${JSON.stringify(config.address, null, 2)}</textarea>
    </dd>
  </div>
  <div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">
        Passport Claim
    </dt>
    <dd class="govuk-summary-list__value" id="user-info-passport-claim-present">
    <textarea class="govuk-textarea" rows="7" id="passport_claim" name="passport_claim" type="text">${JSON.stringify(config.passport, null, 2)}</textarea>
    </dd>
  </div>
  <div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">
        Driving Permit Claim
    </dt>
    <dd class="govuk-summary-list__value" id="user-info-driving-permit-claim-present">
    <textarea class="govuk-textarea" rows="8" id="driving_permit_claim" name="driving_permit_claim" type="text">${JSON.stringify(config.drivingPermit, null, 2)}</textarea>
    </dd>
  </div>
  <div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">
        Social Security Record Claim
    </dt>
    <dd class="govuk-summary-list__value" id="user-info-social-security-record-claim-present">
    <textarea class="govuk-textarea" rows="5" id="nino_claim" name="nino_claim" type="text">${JSON.stringify(config.socialSecurityRecord, null, 2)}</textarea>
    </dd>
  </div>
  <div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">
        Return Code Claim
    </dt>
    <dd class="govuk-summary-list__value" id="user-info-return-code-claim-present">
    <textarea class="govuk-textarea" rows="8" id="return_code_claim" name="return_code_claim" type="text">${JSON.stringify(config.returnCode, null, 2)}</textarea>
    </dd>
  </div>
  </dl>
    <button name="continue" value="continue" class="govuk-button">Continue</button>
  </form>`
  );
}
