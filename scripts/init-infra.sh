#!/usr/bin/env bash

awslocal dynamodb create-table --table-name local-IpvStub-UserIdentity --key-schema AttributeName=UserIdentityId,KeyType=HASH --attribute-definitions AttributeName=UserIdentityId,AttributeType=S --billing-mode PAY_PER_REQUEST --region eu-west-2
awslocal dynamodb create-table --table-name local-AuthStub-AuthCode --key-schema AttributeName=authCode,KeyType=HASH --attribute-definitions AttributeName=authCode,AttributeType=S --billing-mode PAY_PER_REQUEST --region eu-west-2
awslocal dynamodb create-table --table-name local-AuthStub-AccessToken --key-schema AttributeName=accessToken,KeyType=HASH --attribute-definitions AttributeName=accessToken,AttributeType=S --billing-mode PAY_PER_REQUEST --region eu-west-2
awslocal dynamodb create-table --table-name local-AuthStub-UserProfile --key-schema AttributeName=email,KeyType=HASH --attribute-definitions AttributeName=email,AttributeType=S AttributeName=subjectId,AttributeType=S --global-secondary-indexes \
          "[
              {
                \"IndexName\": \"SubjectIdIndex\",
                \"KeySchema\": [
                  { \"AttributeName\": \"subjectId\", \"KeyType\": \"HASH\"}
                ],
                \"Projection\": {\"ProjectionType\":\"ALL\"}
              }
          ]" \
  --billing-mode PAY_PER_REQUEST --region eu-west-2


  awslocal dynamodb create-table --table-name local-AIS-stub-interventions --key-schema AttributeName=pairwiseId,KeyType=HASH --billing-mode PAY_PER_REQUEST --attribute-definitions AttributeName=pairwiseId,AttributeType=S --region eu-west-2