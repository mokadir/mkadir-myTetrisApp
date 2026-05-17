#!/usr/bin/env groovy
// =============================================================================
// TetrisApp — Jenkins CI/CD Pipeline for Kubernetes Agents
// =============================================================================
// Builds a React app with Node.js, packages with Nginx,
// scans with Trivy, pushes to Docker Hub
// =============================================================================

pipeline {
    agent {
        kubernetes {
            label 'tetrisapp-kaniko-agent'
            defaultContainer 'tools'
            yaml '''
apiVersion: v1
kind: Pod
metadata:
  namespace: ns-jenkins
spec:
  serviceAccountName: jenkins
  containers:
    - name: tools
      image: node:20-alpine
      command: ['sh', '-c', 'cat']
      tty: true
    - name: kaniko
      image: gcr.io/kaniko-project/executor:v1.24.0-debug
      command: ['/busybox/sh', '-c', 'cat']
      tty: true
    - name: trivy
      image: aquasec/trivy:0.52.2
      command: ['sh', '-c', 'cat']
      tty: true
'''
        }
    }

    parameters {
        string(name: 'DOCKERHUB_ORG',
               defaultValue: 'mokadir',
               description: 'Docker Hub organisation/username')

        string(name: 'IMAGE_TAG',
               defaultValue: '${BUILD_NUMBER}',
               description: 'Image tag. Leave empty to auto-generate from branch+commit')

        string(name: 'GIT_BRANCH',
               defaultValue: 'main',
               description: 'Git branch to build from')

        choice(name: 'BUILD_ENV',
               choices: ['staging', 'production'],
               description: 'Target environment')

        booleanParam(name: 'RUN_CONTAINER_SCAN',
                     defaultValue: true,
                     description: 'Run Trivy image scan after build')

        booleanParam(name: 'PUSH_IMAGE',
                     defaultValue: true,
                     description: 'Push image to Docker Hub')

        booleanParam(name: 'PUSH_LATEST_TAG',
                     defaultValue: true,
                     description: 'Also push :latest on main/production')

        string(name: 'TRIVY_SEVERITY',
               defaultValue: 'HIGH,CRITICAL',
               description: 'Trivy severity threshold')

        booleanParam(name: 'FAIL_ON_VULN',
                     defaultValue: false,
                     description: 'Fail build on vulnerabilities')

        string(name: 'SLACK_CHANNEL',
               defaultValue: '',
               description: 'Optional Slack channel for notifications')
    }

    environment {
        DOCKERHUB_ORG  = "${params.DOCKERHUB_ORG}"
        BUILD_ENV      = "${params.BUILD_ENV}"
        TRIVY_SEVERITY = "${params.TRIVY_SEVERITY}"
        IMAGE_TAG      = "${params.IMAGE_TAG}"
        SHORT_SHA      = ''
        APP_NAME       = 'tetrisapp'
    }

    options {
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20', artifactNumToKeepStr: '5'))
        timestamps()
    }

    stages {
        // -----------------------------------------------------------------------
        // Stage 1: Checkout
        // -----------------------------------------------------------------------
        stage('Checkout') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: "*/${params.GIT_BRANCH}"]],
                    extensions: [[$class: 'CleanBeforeCheckout']],
                    userRemoteConfigs: scm.userRemoteConfigs
                ])
            }
        }

        // -----------------------------------------------------------------------
        // Stage 2: Resolve Metadata
        // -----------------------------------------------------------------------
        stage('Resolve Metadata') {
            steps {
                container('tools') {
                    script {
                        sh 'apk add --no-cache git >/dev/null 2>&1'
                        sh 'git config --global --add safe.directory ${WORKSPACE}'
                        env.SHORT_SHA = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                        def rawTag = params.IMAGE_TAG?.trim()
                        def safeBranch = params.GIT_BRANCH.replaceAll('[^a-zA-Z0-9._-]', '-').toLowerCase()
                        env.IMAGE_TAG = rawTag ? rawTag : "${safeBranch}-${env.SHORT_SHA}"
                        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                        echo "  Application  : ${env.APP_NAME}"
                        echo "  Organisation : ${env.DOCKERHUB_ORG}"
                        echo "  Image Tag    : ${env.IMAGE_TAG}"
                        echo "  Branch       : ${params.GIT_BRANCH}"
                        echo "  Environment  : ${env.BUILD_ENV}"
                        echo "  Commit       : ${env.SHORT_SHA}"
                        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                    }
                }
            }
        }

        // -----------------------------------------------------------------------
        // Stage 3: Preflight — verify all tooling is present
        // -----------------------------------------------------------------------
        stage('Preflight') {
            steps {
                container('tools') {
                    sh '''
                        set -eux
                        node --version
                        npm --version
                    '''
                }
                container('kaniko') {
                    sh '/kaniko/executor version'
                }
                container('trivy') {
                    sh 'trivy --version'
                }
            }
        }

        // -----------------------------------------------------------------------
        // Stage 4: Install dependencies
        // -----------------------------------------------------------------------
        stage('Install Dependencies') {
            steps {
                container('tools') {
                    sh '''
                        set -eux
                        rm -rf node_modules
                        npm install --loglevel=error --omit=optional --ignore-scripts --no-audit --no-fund
                        echo "Dependencies installed successfully"
                    '''
                }
            }
        }

        // -----------------------------------------------------------------------
        // Stage 5: TypeScript Check
        // -----------------------------------------------------------------------
        stage('TypeScript Check') {
            steps {
                container('tools') {
                    sh '''
                        set -eux
                        npx tsc --noEmit
                        echo "TypeScript check passed"
                    '''
                }
            }
        }

        // -----------------------------------------------------------------------
        // Stage 6: Build
        // -----------------------------------------------------------------------
        stage('Build') {
            steps {
                container('tools') {
                    sh '''
                        set -eux
                        npm run build
                        echo "Build completed successfully"
                    '''
                }
            }
        }

        // -----------------------------------------------------------------------
        // Stage 7: Prepare Registry Auth
        // -----------------------------------------------------------------------
        stage('Prepare Registry Auth') {
            when { expression { params.PUSH_IMAGE } }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-cred',
                    usernameVariable: 'DOCKERHUB_USERNAME',
                    passwordVariable: 'DOCKERHUB_PASSWORD'
                )]) {
                    container('kaniko') {
                        sh '''
                            set -eu
                            mkdir -p /kaniko/.docker
                            cat > /kaniko/.docker/config.json <<EOF
{
  "auths": {
    "https://index.docker.io/v1/": {
      "username": "${DOCKERHUB_USERNAME}",
      "password": "${DOCKERHUB_PASSWORD}"
    }
  }
}
EOF
                        '''
                    }
                }
            }
        }

        // -----------------------------------------------------------------------
        // Stage 8: Build & Push Docker Image (Kaniko)
        // -----------------------------------------------------------------------
        stage('Build & Push Docker Image') {
            steps {
                script {
                    def imageName = "${env.DOCKERHUB_ORG}/${env.APP_NAME}:${env.IMAGE_TAG}"
                    def tarPath = "${env.WORKSPACE}/${env.APP_NAME}-${env.IMAGE_TAG}.tar"

                    try {
                        // Build Kaniko command
                        def kanikoCommand = "/kaniko/executor" +
                            " --context ${env.WORKSPACE}" +
                            " --dockerfile ${env.WORKSPACE}/Dockerfile" +
                            " --destination ${imageName}"

                        // Optionally push :latest
                        if (params.PUSH_IMAGE && params.PUSH_LATEST_TAG) {
                            def latestTag = "${env.DOCKERHUB_ORG}/${env.APP_NAME}:latest"
                            kanikoCommand += " --destination ${latestTag}"
                        }

                        // OCI labels
                        kanikoCommand += " --label org.opencontainers.image.revision=${env.SHORT_SHA}"
                        kanikoCommand += " --label org.opencontainers.image.source=https://github.com/${env.DOCKERHUB_ORG}/${env.APP_NAME}"
                        kanikoCommand += " --label org.opencontainers.image.version=${env.IMAGE_TAG}"
                        kanikoCommand += " --label com.${env.APP_NAME}.environment=${env.BUILD_ENV}"
                        kanikoCommand += " --snapshot-mode=redo --use-new-run --cache=false"

                        if (!params.PUSH_IMAGE) {
                            kanikoCommand += ' --no-push'
                        }

                        if (params.RUN_CONTAINER_SCAN && !params.PUSH_IMAGE) {
                            kanikoCommand += " --tar-path ${tarPath}"
                        }

                        // Execute Kaniko with retry
                        container('kaniko') {
                            sh """
                                set -eux
                                export GODEBUG=http2client=0
                                retry_count=0
                                until [ "\$retry_count" -ge 3 ]; do
                                    echo "Kaniko push — attempt \$((retry_count + 1))"
                                    ${kanikoCommand} && break
                                    rc=\$?
                                    echo "Kaniko push failed with exit code \$rc"
                                    retry_count=\$((retry_count + 1))
                                    if [ "\$retry_count" -ge 3 ]; then
                                        exit \$rc
                                    fi
                                    echo "Retrying in 5s..."
                                    sleep 5
                                done
                            """
                        }

                        // -------------------------------------------------------------------
                        // Trivy Container Image Scan
                        // -------------------------------------------------------------------
                        if (params.RUN_CONTAINER_SCAN) {
                            container('trivy') {
                                if (params.PUSH_IMAGE) {
                                    sh """
                                        trivy image \
                                            --exit-code ${params.FAIL_ON_VULN ? '1' : '0'} \
                                            --severity ${env.TRIVY_SEVERITY} \
                                            --format table \
                                            --output trivy-image-report.txt \
                                            ${imageName} || true
                                    """
                                } else {
                                    sh """
                                        trivy image \
                                            --input ${tarPath} \
                                            --exit-code ${params.FAIL_ON_VULN ? '1' : '0'} \
                                            --severity ${env.TRIVY_SEVERITY} \
                                            --format table \
                                            --output trivy-image-report.txt \
                                            || true
                                    """
                                }
                            }
                            archiveArtifacts artifacts: 'trivy-image-report.txt', allowEmptyArchive: true
                            publishHTML(target: [
                                allowMissing: true,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: '.',
                                reportFiles: 'trivy-image-report.txt',
                                reportName: 'Trivy Security Scan'
                            ])
                        }

                    } catch (err) {
                        echo "ERROR: Image build failed — ${err.message}"
                        currentBuild.result = 'UNSTABLE'
                        error("Image build failed: ${err.message}")
                    }
                }
            }
        }

    }

    // ---------------------------------------------------------------------------
    // Post-build actions
    // ---------------------------------------------------------------------------
    post {
        always {
            script {
                // Slack notification
                if (params.SLACK_CHANNEL?.trim()) {
                    try {
                        def status = currentBuild.currentResult
                        def color = status == 'SUCCESS' ? 'good'
                                   : (status == 'UNSTABLE' ? 'warning' : 'danger')
                        slackSend(
                            channel: params.SLACK_CHANNEL,
                            color: color,
                            message: """
                                TetrisApp CI/CD ${status}
                                • Branch     : ${params.GIT_BRANCH}
                                • Tag        : ${env.IMAGE_TAG}
                                • Env        : ${env.BUILD_ENV}
                                • Build      : ${env.BUILD_URL}
                                • Image      : ${env.DOCKERHUB_ORG}/${env.APP_NAME}:${env.IMAGE_TAG}
                            """.stripIndent().trim(),
                            tokenCredentialId: 'slack-bot-token'
                        )
                    } catch (ignored) {
                        echo 'Slack notification skipped (not configured)'
                    }
                }

                // Clean workspace
                cleanWs()
            }
        }

        failure {
            script {
                echo "❌ Pipeline FAILED — check logs above for details"
                currentBuild.description = "❌ FAILED — ${env.IMAGE_TAG}"
            }
        }

        unstable {
            script {
                echo "⚠️  Pipeline completed with UNSTABLE status"
                currentBuild.description = "⚠️ UNSTABLE — ${env.IMAGE_TAG}"
            }
        }

        success {
            script {
                echo "✅ Pipeline SUCCEEDED"
                currentBuild.description = "✅ ${env.DOCKERHUB_ORG}/${env.APP_NAME}:${env.IMAGE_TAG}"
            }
        }

        cleanup {
            script {
                echo "🧹 Cleaning up workspace"
            }
        }
    }
}