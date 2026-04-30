import { renderPage } from "../template.ts";

export default function renderAuthError(rpStubUrl?: string) {
  return renderPage(
    "Auth stub error page",
    `<h1 class="govuk-heading-l">Auth stub error page</h1>
    <p class="govuk-body">Orchestration redirects to this page if it encounters an error,
       check the orchestration logs for details.</p>
    ${rpStubUrl ? `<a href="${rpStubUrl}" class="govuk-button">Return to stub</a>` : ""}`
  );
}
