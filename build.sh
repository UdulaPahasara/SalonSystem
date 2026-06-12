#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "Building Salon Management System..."
./mvnw clean package -DskipTests

JAR="$ROOT/target/SalonManagementSystem-0.0.1-SNAPSHOT.jar"

if [[ ! -f "$JAR" ]]; then
  echo "Build failed: JAR not found at $JAR" >&2
  exit 1
fi

echo ""
echo "Build complete."
echo ""
echo "Deploy ONLY this file to your server:"
echo "  $JAR"
echo ""
echo "Run on server:"
echo "  java -jar SalonManagementSystem-0.0.1-SNAPSHOT.jar"
echo ""
echo "Open: http://localhost:8081/salon-app/"
