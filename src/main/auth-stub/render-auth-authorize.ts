import { renderPage } from "../template.ts";
import {
  createUserProfile,
  DEFAULT_CLAIMS,
} from "./helpers/mock-token-data-helper.ts";
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
    <button name="continue" value="continue" class="govuk-button">Continue</button>
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
      <h3>User info Claim</h3>
      ${Object.entries(createUserProfile(DEFAULT_CLAIMS))
        .map((entry) => {
          const key = entry[0];
          const value = entry[1];
          if (key === "terms_and_conditions") {
            return;
          }
          return `
          <div class="govuk-summary-list__row">
          <dt class="govuk-summary-list__key">${key}</dt>
          <dd class="govuk-summary-list__value" id="userinfo-${key}">
          ${
            typeof value === "boolean"
              ? `<div class="govuk-checkboxes__item">
            <input class="govuk-checkboxes__input" id="userinfo-${key}" name="userinfo-${key}" type="checkbox" value="true" ${value ? "checked" : ""}/>
            <label class="govuk-label govuk-checkboxes__label" for="userinfo-${key}"></label>
            </div>`
              : `<input class="govuk-textarea" id="userinfo-${key}" name="userinfo-${key}" type="text" value="${value || ""}">`
          }
          </dd>
          </div>
        `;
        })
        .join("\n")}
    </dl>

    <button name="continue" value="continue" class="govuk-button">Continue</button>
  </form>`
  );
}
