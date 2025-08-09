#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { StorageStack } from '../lib/storage-stack';
import { InfoStack } from '../lib/info-stack';
import { StaticSiteStack } from '../lib/static-site-stack';


const app = new cdk.App();

// const env = {
//   account: process.env.CDK_DEFAULT_ACCOUNT,
//   region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
// };
const env = { account: '195355138180', region: 'ap-northeast-1' };
const storage = new StorageStack(app, 'InfoStorageStack', { env });


new InfoStack(app, 'InfoStack', {
  bucket: storage.bucket,
  env
});

new StaticSiteStack(app, 'StaticSiteStack', {
  env
});