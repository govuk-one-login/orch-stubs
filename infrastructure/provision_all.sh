AWS_ACCOUNT=${1}

PROVISION_COMMAND="../../devplatform-deploy/stack-orchestration-tool/provisioner.sh"

export AUTO_APPLY_CHANGESET=true
export SKIP_AWS_AUTHENTICATION=true
export AWS_PAGER=""

## Provision dependencies
for dir in configuration/"$AWS_ACCOUNT"/*/; do
  STACK=$(basename "$dir")
  if [[ $STACK != "$AWS_ACCOUNT-auth-stub-pipeline" && $STACK != "$AWS_ACCOUNT-ipv-stub-pipeline" && -f configuration/$AWS_ACCOUNT/$STACK/parameters.json ]]; then
    $PROVISION_COMMAND "$AWS_ACCOUNT" "$STACK" "$STACK" LATEST &
  fi
done

## Provision secure pipelines
for dir in configuration/"$AWS_ACCOUNT"/*/; do
  STACK=$(basename "$dir")
  if [[ $STACK == "$AWS_ACCOUNT-auth-stub-pipeline" || $STACK == "$AWS_ACCOUNT-ipv-stub-pipeline" ]]; then
    $PROVISION_COMMAND "$AWS_ACCOUNT" "$STACK" sam-deploy-pipeline LATEST
  fi
done
