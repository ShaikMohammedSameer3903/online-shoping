# syntax=docker/dockerfile:1

# ---- Build stage: compile Spring Boot app ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy only pom first for better layer caching
COPY pom.xml .
# Copy source
COPY src ./src

# Build the jar (skip tests for faster image builds; tests should run in CI)
RUN --mount=type=cache,target=/root/.m2 mvn -B -DskipTests package

# ---- Runtime stage: run with a slim JRE ----
FROM eclipse-temurin:21-jre
WORKDIR /app

# Allow passing extra JVM opts at runtime
ENV JAVA_OPTS=""
# Set default server port; can be overridden at runtime
ENV SERVER_PORT="8081"

# Copy the fat jar built in previous stage
COPY --from=build /app/target/*.jar /app/app.jar

# Expose the configured port
EXPOSE 8081

# Run the application
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar /app/app.jar --server.port=${SERVER_PORT}"]
