import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cf from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';


export class StaticSiteStack extends cdk.Stack {
  public readonly distribution: cf.Distribution;
  public readonly siteBucket: s3.IBucket;
  public readonly dataBucket: s3.IBucket;

  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    // Frontend (静的) バケット
    this.siteBucket = new s3.Bucket(this, 'SiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Data バケット（JSON/NDJSON/Parquetを置く）
    this.dataBucket = new s3.Bucket(this, 'DataBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedOrigins: ['*'], // CloudFront経由なら実際はCFドメインに絞るとよい
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedHeaders: ['*'],
          exposedHeaders: [],
          maxAge: 86400,
        },
      ],
    });

    // CloudFront Origins
    const siteOrigin = new origins.S3StaticWebsiteOrigin(this.siteBucket);
    const dataOrigin = new origins.S3StaticWebsiteOrigin(this.dataBucket);

    // デフォルト動作: サイト配信（/index.html 短TTL）
    this.distribution = new cf.Distribution(this, 'SiteDistribution', {
      defaultBehavior: {
        origin: siteOrigin,
        cachePolicy: new cf.CachePolicy(this, 'SiteCachePolicy', {
          defaultTtl: cdk.Duration.seconds(60),
          minTtl: cdk.Duration.seconds(0),
          maxTtl: cdk.Duration.minutes(10),
          enableAcceptEncodingBrotli: true,
          enableAcceptEncodingGzip: true,
        }),
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      additionalBehaviors: {
        // /data/* は長めTTL（静的データ想定、日次更新）
        'data/*': {
          origin: dataOrigin,
          cachePolicy: new cf.CachePolicy(this, 'DataCachePolicy', {
            defaultTtl: cdk.Duration.hours(12),
            minTtl: cdk.Duration.minutes(5),
            maxTtl: cdk.Duration.days(7),
            enableAcceptEncodingBrotli: true,
            enableAcceptEncodingGzip: true,
          }),
          viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        // SPA ルーティング: 404/403 → /index.html
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' },
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html' },
      ],
    });

    // OACポリシーをバケットに許可（サイト用）
    this.siteBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [this.siteBucket.arnForObjects('*')],
      principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
      conditions: {
        StringEquals: { 'AWS:SourceArn': this.distribution.distributionArn },
      },
    }));

    // OACポリシーをバケットに許可（データ用）
    this.dataBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [this.dataBucket.arnForObjects('*')],
      principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
      conditions: {
        StringEquals: { 'AWS:SourceArn': this.distribution.distributionArn },
      },
    }));

    // デプロイ（任意）：/frontend/dist を siteBucket にアップロード
    // cdk deploy 時に最新ビルドを反映したい場合
    // new s3deploy.BucketDeployment(this, 'DeployFrontend', {
    //   destinationBucket: this.siteBucket,
    //   sources: [s3deploy.Source.asset('frontend/dist')],
    //   distribution: this.distribution,
    //   distributionPaths: ['/*'],
    //   cacheControl: [
    //     s3deploy.CacheControl.setPublic(),
    //     s3deploy.CacheControl.maxAge(cdk.Duration.days(30)),
    //   ],
    // });

    // 将来：データの静的アップロード用BucketDeploymentも追加可（例：/data/manifest.json）
    // new s3deploy.BucketDeployment(this, 'DeployData', {
    //   destinationBucket: this.dataBucket,
    //   sources: [s3deploy.Source.asset('exported-data')], // ローカル日次出力先
    //   destinationKeyPrefix: 'data', // s3://DataBucket/data/...
    // });
  }
}
