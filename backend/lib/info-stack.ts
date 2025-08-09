import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
// alpha モジュールは aws-cdk-lib からインポート
import { PythonFunction } from '@aws-cdk/aws-lambda-python-alpha';

type AppStackProps = cdk.StackProps & {
  bucket: s3.IBucket;
};

export class InfoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);


    // Python Lambda（lambda/ 配下をビルド。同階層 requirements.txt を自動同梱）
    const fn = new PythonFunction(this, 'RssFetcherFn', {
      entry: 'functions',                 // ディレクトリ
      index: 'handler.py',     // ファイル
      handler: 'handler',              // 関数名
      runtime: lambda.Runtime.PYTHON_3_12,
      memorySize: 512,
      timeout: cdk.Duration.minutes(3),
       environment: {
        BUCKET_NAME: props.bucket.bucketName,
      },
    });

    // S3書き込み権限（スタック跨ぎでもOK：CDKがExport/Importを自動生成）
    props.bucket.grantPut(fn);
    props.bucket.grantRead(fn, props.bucket.arnForObjects('*')); // もし読む可能性があれば

    // EventBridge: 毎時00分実行
    const rule = new events.Rule(this, 'HourlySchedule', {
      schedule: events.Schedule.cron({ minute: '0', hour: '*' }),
    });
    rule.addTarget(new targets.LambdaFunction(fn));
  }
}
