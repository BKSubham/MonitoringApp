const cdk = require("aws-cdk-lib");
const { Stack } = cdk;
const codepipeline = require("aws-cdk-lib/aws-codepipeline");
const codepipeline_actions = require("aws-cdk-lib/aws-codepipeline-actions");
const codebuild = require("aws-cdk-lib/aws-codebuild");
const s3 = require("aws-cdk-lib/aws-s3");
const iam = require("aws-cdk-lib/aws-iam");
const secretsmanager = require("aws-cdk-lib/aws-secretsmanager");

class PipelineStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Create an S3 bucket to store pipeline artifacts
    const artifactBucket = new s3.Bucket(this, "ArtifactBucket", {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Define the IAM role for the pipeline
    const pipelineRole = new iam.Role(this, "PipelineRole", {
      assumedBy: new iam.ServicePrincipal("codepipeline.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AWSCodeBuildDeveloperAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AWSCodePipelineDeveloperAccess"), // Updated to valid policy
      ],
    });

    // Define a custom inline policy for additional permissions
    const customPolicy = new iam.Policy(this, "CustomPipelinePolicy", {
      statements: [
        new iam.PolicyStatement({
          actions: [
            "codepipeline:List*",
            "codepipeline:Get*",
            "codepipeline:StartPipelineExecution",
            "codepipeline:RetryStageExecution",
            // Add other necessary actions here
          ],
          resources: ["*"],
        }),
      ],
    });

    // Attach the custom inline policy to the pipeline role
    pipelineRole.attachInlinePolicy(customPolicy);

    // Reference GitHub token from AWS Secrets Manager
    const githubToken = secretsmanager.Secret.fromSecretNameV2(this, 'GitHubToken', 'my-github-token');

    // Define the source action for the pipeline (GitHub repository)
    const sourceOutput = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: "GitHubSource",
      owner: "PrajwolDhungan",  // Replace with your GitHub username
      repo: "MonitoringApp", // Replace with your repository name
      branch: "Notificationprazz", // Replace with your branch name
      oauthToken: githubToken.secretValue,
      output: sourceOutput,
      trigger: codepipeline_actions.GitHubTrigger.WEBHOOK,
    });

    // Define the CodeBuild project and build action
    const buildProject = new codebuild.PipelineProject(this, "BuildProject", {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: "0.2",
        phases: {
          install: {
            commands: ["npm install"],
          },
          build: {
            commands: ["npm run build", "npm run test"],
          },
        },
        artifacts: {
          "base-directory": "dist",
          files: ["**/*"],
        },
      }),
    });

    const buildOutput = new codepipeline.Artifact();
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: "CodeBuild",
      project: buildProject,
      input: sourceOutput,
      outputs: [buildOutput],
    });

    // Define the deployment action to deploy artifacts to S3
    const deployAction = new codepipeline_actions.S3DeployAction({
      actionName: "S3Deploy",
      bucket: artifactBucket,
      input: buildOutput,
    });

    // Create the pipeline with the defined stages
    new codepipeline.Pipeline(this, "Pipeline", {
      role: pipelineRole,
      stages: [
        {
          stageName: "Source",
          actions: [sourceAction],
        },
        {
          stageName: "Build",
          actions: [buildAction],
        },
        {
          stageName: "Deploy",
          actions: [deployAction],
        },
      ],
    });
  }
}

module.exports = { PipelineStack };
