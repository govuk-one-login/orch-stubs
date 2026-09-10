import { renderPage } from "../template.ts";
import { VALID_AUTH_USER_INFO_CLAIMS } from "./helpers/claims-config.ts";
import { AuthRequestBody } from "./interfaces/auth-request-body-interface.ts";

export default function renderAuthAuthorize(
  authRequest: AuthRequestBody,
  authorizeErrors: string[]
) {
  return renderPage(
    "Auth Stub Form",
    `<h1 class="govuk-heading-l">Auth stub</h1>
  <details class="govuk-details">
    <summary class="govuk-details__summary">
      <span class="govuk-details__summary-text">
        Decrypted JAR claims
      </span>
    </summary>
    <pre>${JSON.stringify(authRequest, undefined, 2)}</pre>
  </details>

  <h3 class="govuk-heading-s">Form:</h3>
  <p class="govuk-body">Use this form to configure the required Auth user identity response. On submit a POST request will be sent to /authorize and the Auth OAuth 2.0 flow will be initiated.</p>
  <form method="post">
    <input type="hidden" name="authRequest" value='${JSON.stringify(authRequest)}'>
    <dl class="govuk-summary-list">
      <div class="govuk-summary-list__row" id="emailRow">
        <dt class="govuk-summary-list__key">
            oAuth Error
        </dt>
        <dd class="govuk-summary-list__value" id="email">
        <select class="govuk-select" id="error" name="error">
          <option value="">None</option>
          ${authorizeErrors.map((errorCode) => `<option value="${errorCode}">${errorCode}</option>`)}
        </select>
        </dd>
      </div>
      ${Object.entries(authRequest)
        .map(([key, value]) => {
          if (key === "claims") {
            return;
          }
          return `
          <div class="govuk-summary-list__row">
          <dt class="govuk-summary-list__key">${key}</dt>
          <dd class="govuk-summary-list__value" id="auth-request-${key}">
          ${
            typeof value === "boolean"
              ? `<div class="govuk-checkboxes__item">
            <input class="govuk-checkboxes__input" id="auth-request-${key}" name="auth-request-${key}" type="checkbox" value="true" ${value ? "checked" : ""}/>
            <label class="govuk-label govuk-checkboxes__label" for="auth-request-${key}"></label>
            </div>`
              : `<input class="govuk-textarea" id="auth-request-${key}" name="auth-request-${key}" type="text" value="${value || ""}">`
          }
          </dd>
          </div>
        `;
        })
        .join("\n")}
      ${Object.entries(authRequest.claims)
        .map(([key, value]) => {
          if (key === "claim") {
            return;
          }
          return `
          <div class="govuk-summary-list__row">
          <dt class="govuk-summary-list__key">${key}</dt>
          <dd class="govuk-summary-list__value" id="claims-${key}">
          ${
            typeof value === "boolean"
              ? `<div class="govuk-checkboxes__item">
            <input class="govuk-checkboxes__input" id="claims-${key}" name="claims-${key}" type="checkbox" value="true" ${value ? "checked" : ""}/>
            <label class="govuk-label govuk-checkboxes__label" for="claims-${key}"></label>
            </div>`
              : `<input class="govuk-textarea" id="claims-${key}" name="claims-${key}" type="text" value="${value || ""}">`
          }
          </dd>
          </dd>
          </div>
        `;
        })
        .join("\n")}
      <h3>User info Claim</h3>
      ${VALID_AUTH_USER_INFO_CLAIMS.map((claim) => {
        const userInfoClaims = Object.keys(
          JSON.parse(authRequest.claims.claim!).userinfo
        );
        return `
          <div class="govuk-summary-list__row">
          <dt class="govuk-summary-list__key">${claim}</dt>
          <dd class="govuk-summary-list__value" id="userinfo-${claim}">
          <div class="govuk-checkboxes__item">
          <input class="govuk-checkboxes__input" id="userinfo-${claim}" name="userinfo-${claim}" type="checkbox" value="true" ${userInfoClaims.includes(claim) ? "checked" : ""}/>
          <label class="govuk-label govuk-checkboxes__label" for="userinfo-${claim}"></label>
          </dd>
          </div>
        `;
      }).join("\n")}
    </dl>

    <button name="continue" value="continue" class="govuk-button">Continue</button>
  </form>`
  );
}
