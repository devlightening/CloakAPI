@echo off
setlocal
echo Starting Next.js dashboard on http://localhost:3000
pushd frontend\cloakapi-dashboard
npm install
npm run dev
popd
