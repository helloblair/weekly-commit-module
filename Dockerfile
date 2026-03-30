# ── Stage 1: Build backend ────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS backend-build
WORKDIR /app
COPY pom.xml .
COPY src/main src/main
RUN apk add --no-cache maven \
    && mvn package -DskipTests -B --no-transfer-progress \
    && mv target/weekly-commit-module-*.jar target/app.jar

# ── Stage 2: Build frontend ──────────────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY tsconfig.json webpack.config.ts ./
COPY public public
COPY src src
RUN npm run build

# ── Stage 3: Production image ───────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Backend JAR
COPY --from=backend-build /app/target/app.jar app.jar

# Frontend static assets served by nginx sidecar or embedded
COPY --from=frontend-build /app/dist /app/static

EXPOSE 8081

ENV JAVA_OPTS=""
ENV SPRING_PROFILES_ACTIVE=prod

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
