import { renderPage } from "../template";
import { AuthRequestBody } from "./interfaces/auth-request-body-interface";

export default function renderAuthAuthorize(
  authRequest: AuthRequestBody,
  authorizeErrors: string[]
) {
  return renderPage(
    "Auth Stub Form",
    `<h1 class="govuk-heading-l">Auth stub</h1>
  <h3 class="govuk-heading-s">Decrypted JAR Claims:</h3>
  
  <h3 class="govuk-heading-s">Form:</h3>
  <p class="govuk-body">Use this form to configure the required Auth user identity response. On submit a POST request will be sent to /authorize and the Auth OAuth 2.0 flow will be initiated.</p>
  <form action="/authorize" method="post">
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
    </dl>

    <button name="continue" value="continue" class="govuk-button">Continue</button>
  </form>`
  );
}
