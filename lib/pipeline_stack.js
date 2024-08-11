// pipeline-stack.js
const cdk = require("aws-cdk-lib");
const { Stack } = cdk;
const s3 = require("aws-cdk-lib/aws-s3");
const codepipeline = require("aws-cdk-lib/aws-codepipeline");
const codepipeline_actions = require("aws-cdk-lib/aws-codepipeline-actions");
const codebuild = require("aws-cdk-lib/aws-codebuild");
const secretsmanager = require("aws-cdk-lib/aws-secretsmanager");

class CICDPipeline extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Define the artifact bucket for the pipeline
    const artifactBucket = new s3.Bucket(this, "ArtifactBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Define the pipeline
    const pipeline = new codepipeline.Pipeline(this, "Pipeline", {
      pipelineName: "CICDPipeline",
      artifactBucket: artifactBucket,
    });

    // Define the GitHub token secret
    const githubToken = secretsmanager.Secret.fromSecretAttributes(
      this,
      "GitHubToken",
      {
        secretArn:
          "arn:aws:secretsmanager:us-east-1:975049953018:secret:CICDPipelinetoken-UTwymt",
      }
    );

    // Source stage
    const sourceOutput = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: "GitHub_Source",
      owner: "ManishaNagarkoti11",
      repo: "MonitoringApp",
      oauthToken: cdk.SecretValue.secretsManager("CICDPipelinetoken"),
      output: sourceOutput,
      branch: "master",
    });

    pipeline.addStage({
      stageName: "Source",
      actions: [sourceAction],
    });

    // Build stage
    const buildOutput = new codepipeline.Artifact();
    const buildProject = new codebuild.PipelineProject(this, "BuildProject", {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: "0.2",
        phases: {
          install: {
            commands: "npm install",
          },
          build: {
            commands: [
              "npm run build",
              "cdk synth", // Synthesize the CDK app
            ],
          },
        },
        artifacts: {
          "base-directory": "cdk.out",
          files: "**/*",
        },
      }),
    });

    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: "Build",
      project: buildProject,
      input: sourceOutput,
      outputs: [buildOutput],
    });

    pipeline.addStage({
      stageName: "Build",
      actions: [buildAction],
    });

    // Deploy stage
    const deployAction =
      new codepipeline_actions.CloudFormationCreateUpdateStackAction({
        actionName: "Deploy",
        stackName: "MonitoringAppStack",
        templatePath: buildOutput.atPath("MonitoringAppStack.template.json"),
        adminPermissions: true,
      });

    pipeline.addStage({
      stageName: "Deploy",
      actions: [deployAction],
    });
  }
}

module.exports = { CICDPipeline };
