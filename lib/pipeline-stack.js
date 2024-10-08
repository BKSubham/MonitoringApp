const cdk = require('aws-cdk-lib');
const codepipeline = require('aws-cdk-lib/aws-codepipeline');
const codepipeline_actions = require('aws-cdk-lib/aws-codepipeline-actions');
const codebuild = require('aws-cdk-lib/aws-codebuild');
const s3 = require('aws-cdk-lib/aws-s3');
const iam = require('aws-cdk-lib/aws-iam');
const { Construct } = require('constructs');

class PipelineStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);


    // S3 bucket for storing artifacts
    const artifactBucket = new s3.Bucket(this, 'PipelineArtifactBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,  // This automatically deletes objects in the bucket when the bucket is deleted
      
    });
    
    // Define a policy document
      const ssmPolicyDocument = new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            actions: ['ssm:GetParameter'],
            resources: ['arn:aws:ssm:us-east-1:975049953018:parameter/cdk-bootstrap/hnb659fds/version'],
          }),
        ],
    });
    
    // Create an IAM policy
    const ssmPolicy = new iam.Policy(this, 'SSMGetParameterPolicy', {
      document: ssmPolicyDocument,
    });


    // Source action - pulls code from GitHub
    const sourceOutput = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'GitHub_Source',
      owner: 'BKSubham',
      repo: 'MonitoringApp',
      oauthToken: cdk.SecretValue.secretsManager('MonitoringAppToken', {
        jsonField: 'github-token',
      }),
      output: sourceOutput,
      branch: 'master', // or the branch you are working on
    });

    // Build action - runs unit tests and builds the application
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: 'npm install',
          },
          build: {
            commands: [
              'npm run build',
              'npm test',
            ],
          },
        },
        artifacts: {
          files: ['**/*'],
        },
      }),
    });

    const buildOutput = new codepipeline.Artifact();
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Build',
      project: buildProject,
      input: sourceOutput,
      outputs: [buildOutput],
    });

    // CDK Deploy action - deploy the MonitoringAppStack
    const cdkDeployProject = new codebuild.PipelineProject(this, 'CdkDeployProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'npm install -g aws-cdk',  // Install AWS CDK globally
              'npm install',             // Install project dependencies
            ],
          },
          build: {
            commands: [
              'cdk --version',  // Verify CDK version
              'cdk deploy MonitoringAppStack --require-approval never',  // Deploy stack
            ],
          },
        },
        artifacts: {
          files: ['**/*'],
        },
      }),
      
    });

    // Attach the policy to the CodeBuild role
    const cdkDeployRole = cdkDeployProject.role;
    ssmPolicy.attachToRole(cdkDeployRole);

    const cdkDeployAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'CdkDeploy',
      project: cdkDeployProject,
      input: buildOutput,
    });

    // Deploy to Beta/Gamma environment
    const betaDeployAction = new codepipeline_actions.S3DeployAction({
      actionName: 'Deploy_to_Beta',
      bucket: new s3.Bucket(this, 'BetaBucket', {
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Automatically delete the bucket when the stack is destroyed
        autoDeleteObjects: true,  // This automatically deletes objects in the bucket when the bucket is deleted

      }),
      input: buildOutput,
    });

    // Deploy to Prod environment
    const prodDeployAction = new codepipeline_actions.S3DeployAction({
      actionName: 'Deploy_to_Prod',
      bucket: new s3.Bucket(this, 'ProdBucket', {
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Automatically delete the bucket when the stack is destroyed
        autoDeleteObjects: true,  // This automatically deletes objects in the bucket when the bucket is deleted

      }),
      input: buildOutput,
    });

    // Define the pipeline
    new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: 'WebCrawlerPipeline',
      artifactBucket: artifactBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [sourceAction],
        },
        {
          stageName: 'Build',
          actions: [buildAction],
        },
        {
          stageName: 'Deploy',
          actions: [cdkDeployAction],
        },
        {
          stageName: 'Beta_Deploy',
          actions: [betaDeployAction],
        },
        {
          stageName: 'Prod_Deploy',
          actions: [prodDeployAction],
        },
      ],
    });
  }
}

module.exports = { PipelineStack };
