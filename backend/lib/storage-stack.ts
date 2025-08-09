import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class StorageStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.bucket = new s3.Bucket(this, 'RssBucket', {
      bucketName:"info-rss-bucket",
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // 本番は RETAIN 推奨
      // autoDeleteObjects は付けない（権限エラー回避）
    });

    // 必要ならライフサイクル（例：30日で削除）
    // this.bucket.addLifecycleRule({ expiration: cdk.Duration.days(30) });
  }
}
