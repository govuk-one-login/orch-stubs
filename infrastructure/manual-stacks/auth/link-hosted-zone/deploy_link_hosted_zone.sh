#!/usr/bin/env bash
ENVIRONMENT=${1}

sam deploy --stack-name $ENVIRONMENT-orch-auth-stub-link-hosted-zone \
  --template-file template.yaml \
  --parameter-overrides Environment=$ENVIRONMENT \
  --tags \
    Source=govuk-one-login/orch-stubs \
    Owner=di-orchestration@digital.cabinet-office.gov.uk