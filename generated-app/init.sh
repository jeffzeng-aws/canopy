#!/bin/bash
# Canopy - Quick Start Script
set -e

echo "🌲 Starting Canopy Project Management App..."

# Install dependencies
echo "📦 Installing dependencies..."
cd "$(dirname "$0")"
npm install --silent 2>/dev/null || true

# Install frontend dependencies
if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
  cd frontend
  npm install --silent 2>/dev/null || true
  cd ..
fi

# Try to get API URL from SSM
echo "🔗 Checking for deployed API..."
API_URL=""
if command -v aws &> /dev/null; then
  DEPLOY_STATE=$(aws ssm get-parameter --name "/claude-code/infra/deploy-state" --region us-east-1 --query 'Parameter.Value' --output text 2>/dev/null || echo "")
  if [ -n "$DEPLOY_STATE" ] && [ "$DEPLOY_STATE" != "None" ]; then
    API_URL=$(echo "$DEPLOY_STATE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('apiUrl',''))" 2>/dev/null || echo "")
  fi
fi

if [ -n "$API_URL" ]; then
  echo "✅ API URL found: $API_URL"
  echo "VITE_API_URL=$API_URL" > frontend/.env
else
  echo "⚠️  No deployed API found. Frontend will use localStorage fallback."
fi

# Kill any existing dev server
echo "🔄 Stopping existing dev servers..."
pkill -f "vite.*6174" 2>/dev/null || true
sleep 1

# Start the frontend dev server
echo "🚀 Starting frontend dev server on http://localhost:6174..."
cd frontend
npx vite --host 0.0.0.0 --port 6174 &
VITE_PID=$!
cd ..

echo ""
echo "✅ Canopy is running!"
echo "   Frontend: http://localhost:6174"
if [ -n "$API_URL" ]; then
  echo "   API:      $API_URL"
fi
echo ""
echo "   Press Ctrl+C to stop."

# Wait for the process
wait $VITE_PID
