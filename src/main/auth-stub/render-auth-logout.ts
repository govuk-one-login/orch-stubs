import { renderPage } from "../template.ts";

export default function renderAuthLogout(rpStubUrl?: string) {
  return renderPage(
    "Auth stub logout page",
    `<h1 class="govuk-heading-l">Auth stub logout page</h1>
    <p class="govuk-body">Orchestration redirects to this page after completing a logout without a properly configured post-logout redirect URL.</p>
    ${rpStubUrl ? `<a href="${rpStubUrl}" class="govuk-button">Return to RP stub</a>` : ""}`
  );
}
