ENVIRONMENT=${1}

PROVISION_COMMAND="../../devplatform-deploy/stack-orchestration-tool/provisioner.sh"
TAGS_FILE="$(pwd)/configuration/${ENVIRONMENT}/tags.json"

export AUTO_APPLY_CHANGESET=true
export SKIP_AWS_AUTHENTICATION=true
export AWS_PAGER=""
export TAGS_FILE

## Provision dependencies
for dir in configuration/"$ENVIRONMENT"/*/; do
  STACK=$(basename "$dir")
  if [[ $STACK != "$ENVIRONMENT-auth-stub-pipeline" && $STACK != "$ENVIRONMENT-ipv-stub-pipeline" && $STACK != "$ENVIRONMENT-spot-stub-pipeline"&& -f configuration/$ENVIRONMENT/$STACK/parameters.json ]]; then
    PARAMETERS_FILE="$(pwd)/configuration/${ENVIRONMENT}/${STACK}/parameters.json"
    export PARAMETERS_FILE
    $PROVISION_COMMAND "$ENVIRONMENT" "$STACK" "$STACK" LATEST &
  fi
done

## Provision secure pipelines
for dir in configuration/"$ENVIRONMENT"/*/; do
  STACK=$(basename "$dir")
  if [[ $STACK == "$ENVIRONMENT-auth-stub-pipeline" || $STACK == "$ENVIRONMENT-ipv-stub-pipeline" || $STACK == "$ENVIRONMENT-spot-stub-pipeline" ]]; then
    PARAMETERS_FILE="$(pwd)/configuration/${ENVIRONMENT}/${STACK}/parameters.json"
    export PARAMETERS_FILE
    $PROVISION_COMMAND "$ENVIRONMENT" "$STACK" sam-deploy-pipeline LATEST
  fi
done
