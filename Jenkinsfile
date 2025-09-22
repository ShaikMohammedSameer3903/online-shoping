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
    booleanParam(name: 'RUN_TESTS', defaultValue: false, description: 'Run backend unit tests (may fail if tests are misconfigured). If false, tests are skipped and project is built.')
    booleanParam(name: 'KEEP_RUNNING', defaultValue: true, description: 'If true, do NOT stop the Docker Compose stack after a successful pipeline run.')
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

    stage('Backend: Build/Tests') {
      steps {
        dir(env.BACKEND_DIR) {
          script {
            if (params.RUN_TESTS) {
              if (isUnix()) {
                sh './mvnw -B test'
              } else {
                bat 'mvnw.cmd -B test'
              }
            } else {
              if (isUnix()) {
                sh './mvnw -B -DskipTests=true package'
              } else {
                bat 'mvnw.cmd -B -DskipTests=true package'
              }
            }
          }
        }
      }
    }

    stage('Build Docker images') {
      steps {
        script {
          if (isUnix()) {
            sh """
              set -euxo pipefail
              docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} -f ${BACKEND_DIR}/Dockerfile ${BACKEND_DIR}
              docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -f ${FRONTEND_DIR}/Dockerfile ${FRONTEND_DIR}
            """
          } else {
            bat """
              @echo on
              docker build -t %BACKEND_IMAGE%:%IMAGE_TAG% -f %BACKEND_DIR%/Dockerfile %BACKEND_DIR%
              docker build -t %FRONTEND_IMAGE%:%IMAGE_TAG% -f %FRONTEND_DIR%/Dockerfile %FRONTEND_DIR%
            """
          }
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
            bat '''
              @echo on
              setlocal enabledelayedexpansion
              rem Check MySQL health
              for /f %%A in ('docker inspect ourstore-mysql --format "{{.State.Health.Status}}"') do set DB_HEALTH=%%A
              if NOT "%DB_HEALTH%"=="healthy" (
                echo MySQL not healthy yet & exit /b 1
              )

              rem Retry backend /api/products up to 12 times (about 60s)
              set RET=1
              for /L %%i in (1,1,12) do (
                curl -s -o NUL -w "%%{http_code}" http://localhost:8081/api/products > httpcode.txt
                set /p CODE=<httpcode.txt
                del httpcode.txt
                if "!CODE!"=="200" ( set RET=0 & goto :backend_ready )
                ping -n 6 127.0.0.1 >NUL
              )
              :backend_ready
              if %RET% NEQ 0 exit /b 1

              rem Show simple outputs
              curl -s http://localhost:8081/api/products
              curl -s http://localhost:8082 | more +1
              endlocal
            '''
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
          withCredentials([usernamePassword(credentialsId: params.REGISTRY_CREDENTIALS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
            if (isUnix()) {
              sh '''
                set -euxo pipefail
                echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin ${REGISTRY}
                docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
              '''
              sh '''
                if [ "$BRANCH_NAME" = "main" ] || [ "$BRANCH_NAME" = "master" ]; then
                  docker tag ${BACKEND_IMAGE}:${IMAGE_TAG} ${BACKEND_IMAGE}:latest
                  docker tag ${FRONTEND_IMAGE}:${IMAGE_TAG} ${FRONTEND_IMAGE}:latest
                  docker push ${BACKEND_IMAGE}:latest
                  docker push ${FRONTEND_IMAGE}:latest
                fi
              '''
            } else {
              bat """
                @echo on
                echo %DOCKER_PASS% | docker login -u "%DOCKER_USER%" --password-stdin %REGISTRY%
                docker push %BACKEND_IMAGE%:%IMAGE_TAG%
                docker push %FRONTEND_IMAGE%:%IMAGE_TAG%
              """
              bat """
                @echo on
                if "%BRANCH_NAME%"=="main" ( 
                  docker tag %BACKEND_IMAGE%:%IMAGE_TAG% %BACKEND_IMAGE%:latest & docker push %BACKEND_IMAGE%:latest 
                  docker tag %FRONTEND_IMAGE%:%IMAGE_TAG% %FRONTEND_IMAGE%:latest & docker push %FRONTEND_IMAGE%:latest 
                ) else if ("%BRANCH_NAME%"=="master") (
                  docker tag %BACKEND_IMAGE%:%IMAGE_TAG% %BACKEND_IMAGE%:latest & docker push %BACKEND_IMAGE%:latest 
                  docker tag %FRONTEND_IMAGE%:%IMAGE_TAG% %FRONTEND_IMAGE%:latest & docker push %FRONTEND_IMAGE%:latest 
                )
              """
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
