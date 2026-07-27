#!/usr/bin/env bash

set -euo pipefail
ENVIRONMENT=${1}

PROVISION_COMMAND="../../devplatform-deploy/stack-orchestration-tool/provisioner.sh"
TAGS_FILE="$(pwd)/configuration/${ENVIRONMENT}/tags.json"

export AUTO_APPLY_CHANGESET=true
export SKIP_AWS_AUTHENTICATION=true
export AWS_PAGER=""
export TAGS_FILE

VALID_STACKS="auth-stub-pipeline ipv-stub-pipeline spot-stub-pipeline ais-stub-pipeline sis-stub-pipeline"

## Provision secure pipelines
for dir in configuration/"$ENVIRONMENT"/*/; do
  STACK=$(basename "$dir")
  if [[ $VALID_STACKS =~ ( |^)${STACK/$ENVIRONMENT-/}( |$) ]]; then
    PARAMETERS_FILE="$(pwd)/configuration/${ENVIRONMENT}/${STACK}/parameters.json"
    export PARAMETERS_FILE
    $PROVISION_COMMAND "$ENVIRONMENT" "$STACK" sam-deploy-pipeline LATEST
  fi
done
