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
    KEEP_RUNNING = "${params.KEEP_RUNNING ?: 'false'}"
    COMPOSE_TIMEOUT = '120'
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

    stage('Compose: Validate and Prepare') {
      steps {
        script {
          if (isUnix()) {
            sh '''
              set -euxo pipefail
              docker --version
              docker compose version
              # Ensure external DB volume exists (idempotent)
              docker volume create ourstore_db_data >/dev/null
              # Validate compose file
              docker compose config -q
            '''
          } else {
            bat '''
              @echo on
              docker --version
              docker compose version
              rem Ensure external DB volume exists (idempotent)
              docker volume create ourstore_db_data
              rem Validate compose file
              docker compose config -q
            '''
          }
        }
      }
    }

    stage('Compose: Up stack') {
      steps {
        script {
          if (isUnix()) {
            sh '''
              set -euxo pipefail
              # Bring stack up (recreate, build)
              docker compose down || true
              docker compose up -d --build
              # Wait for services
              docker compose ps
            '''
          } else {
            bat '''
              @echo on
              docker compose down
              docker compose up -d --build
              docker compose ps
            '''
          }
        }
      }
    }

    stage('Smoke tests') {
      steps {
        script {
          // Basic health checks: MySQL healthy, backend responds on /api/products, frontend serves index
          if (isUnix()) {
            sh '''
              set -euxo pipefail
              # Check MySQL health
              docker inspect ourstore-mysql --format '{{json .State.Health.Status}}' | grep -i healthy
              # Curl backend (retry on /api/products instead of actuator)
              for i in $(seq 1 12); do curl -sSf http://localhost:8081/api/products && break || sleep 5; done
              # Curl frontend
              curl -sS http://localhost:8082 | head -n 5
            '''
          } else {
            bat """
              @echo on
              for /f %%A in ('docker inspect ourstore-mysql --format "{{.State.Health.Status}}"') do set DB_HEALTH=%%A
              if NOT "%DB_HEALTH%"=="healthy" (
                echo MySQL not healthy yet & exit /b 1
              )
              powershell -Command "$ErrorActionPreference='SilentlyContinue'; for($i=0;$i -lt 12;$i++){ try { if((iwr http://localhost:8081/api/products -UseBasicParsing).StatusCode -eq 200){ exit 0 } } catch {} ; Start-Sleep -s 5 }; exit 1"
              powershell -Command "iwr http://localhost:8081/api/products -UseBasicParsing | select -exp Content"  
              powershell -Command "iwr http://localhost:8082 -UseBasicParsing | select -exp Content | Select-Object -First 5"
            """
          }
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
      script {
        if (env.KEEP_RUNNING?.toBoolean()) {
          echo "KEEP_RUNNING=true -> leaving stack up"
        } else {
          echo "Tearing down stack after build"
          if (isUnix()) {
            sh 'docker compose down || true'
          } else {
            bat 'docker compose down'
          }
        }
      }
    }
  }
}
