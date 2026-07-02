# 1) Build React UI
FROM node:20-alpine AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2) Build Spring Boot JAR with the UI embedded
FROM maven:3.9-eclipse-temurin-17 AS api
WORKDIR /app
COPY pom.xml ./
RUN mvn -q -B dependency:go-offline -Dskip.frontend.build=true
COPY src ./src
COPY --from=web /web/build ./src/main/resources/static
RUN mvn -q -B package -DskipTests -Dskip.frontend.build=true

# 3) Run
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=api /app/target/SalonManagementSystem-0.0.1-SNAPSHOT.jar app.jar
CMD ["java", "-jar", "app.jar"]
