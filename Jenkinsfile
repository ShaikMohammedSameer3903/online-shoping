pipeline {
  agent any
  tools {
    // Use the JDK tool configured in Jenkins named 'JDK_HOME'
    jdk 'JDK_HOME'
  }
  options {
    skipDefaultCheckout(true)
    timestamps()
  }
  parameters {
    string(name: 'REGISTRY', defaultValue: '', description: 'Docker registry URL (e.g. https://index.docker.io/v1/ for Docker Hub). Leave empty to skip push.')
    string(name: 'IMAGE_PREFIX', defaultValue: 'ourstore', description: 'Registry namespace/repo prefix (e.g. your-dockerhub-username)')
    string(name: 'REGISTRY_CREDENTIALS_ID', defaultValue: '', description: 'Jenkins credentials ID (username/password) for registry auth')
  }
  environment {
    BACKEND_DIR = 's111-project-backend'
    FRONTEND_DIR = 's111-project-frontend'
    BACKEND_IMAGE = "${params.IMAGE_PREFIX}/ourstore-backend"
    FRONTEND_IMAGE = "${params.IMAGE_PREFIX}/ourstore-frontend"
    IMAGE_TAG = "${env.BUILD_NUMBER}"
  }
  stages {
    stage('Checkout') {
      steps {
        checkout scm
        script {
          // Capture short commit for tagging
          def shortSha
          if (isUnix()) {
            shortSha = sh(returnStdout: true, script: 'git rev-parse --short=7 HEAD').trim()
          } else {
            shortSha = bat(returnStdout: true, script: 'git rev-parse --short=7 HEAD').trim()
          }
          env.IMAGE_TAG = "${env.BUILD_NUMBER}-${shortSha}"
        }
      }
    }

    stage('Verify Java') {
      steps {
        script {
          if (isUnix()) {
            sh 'echo Using JAVA_HOME=$JAVA_HOME && java -version'
          } else {
            bat 'echo Using JAVA_HOME=%JAVA_HOME% && java -version'
          }
        }
      }
    }

    stage('Backend: Unit Tests') {
      steps {
        dir(env.BACKEND_DIR) {
          script {
            if (isUnix()) {
              sh './mvnw -B -DskipTests=false test'
            } else {
              bat 'mvnw.cmd -B -DskipTests=false test'
            }
          }
        }
      }
    }

    stage('Build Docker images') {
      steps {
        script {
          // Build backend image
          def be = docker.build("${env.BACKEND_IMAGE}:${env.IMAGE_TAG}", "-f ${env.BACKEND_DIR}/Dockerfile ${env.BACKEND_DIR}")
          // Build frontend image
          def fe = docker.build("${env.FRONTEND_IMAGE}:${env.IMAGE_TAG}", "-f ${env.FRONTEND_DIR}/Dockerfile ${env.FRONTEND_DIR}")
        }
      }
    }

    stage('Push images (optional)') {
      when {
        expression { return params.REGISTRY?.trim() && params.REGISTRY_CREDENTIALS_ID?.trim() }
      }
      steps {
        script {
          docker.withRegistry(params.REGISTRY, params.REGISTRY_CREDENTIALS_ID) {
            docker.image("${env.BACKEND_IMAGE}:${env.IMAGE_TAG}").push()
            docker.image("${env.FRONTEND_IMAGE}:${env.IMAGE_TAG}").push()

            if (env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'master') {
              docker.image("${env.BACKEND_IMAGE}:${env.IMAGE_TAG}").push('latest')
              docker.image("${env.FRONTEND_IMAGE}:${env.IMAGE_TAG}").push('latest')
            }
          }
        }
      }
    }

    stage('Cleanup local images') {
      steps {
        script {
          if (isUnix()) {
            sh 'docker image prune -f'
          } else {
            bat 'docker image prune -f'
          }
        }
      }
    }
  }
  post {
    always {
      archiveArtifacts artifacts: "${BACKEND_DIR}/target/**/*.jar", allowEmptyArchive: true
    }
  }
}
