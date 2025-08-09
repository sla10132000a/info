b:
	cdk bootstrap aws://833812018788/ap-northeast-1 \
  --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess \
  --profile terra1

d:
	cd backend && cdk deploy --require-approval never --profile terra1

ds:
	cd backend && cdk deploy InfoStorageStack --require-approval never --profile user

di:
	cd backend && cdk deploy InfoStack --require-approval never --profile user

dss:
	cd backend && cdk deploy StaticSiteStack --require-approval never --profile user

