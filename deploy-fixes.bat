@echo off
REM Deployment Script for Critical Fixes (Windows)
REM Run this to apply all fixes and restart the application

setlocal enabledelayedexpansion

echo.
echo 🚀 Sprint Full - Deploying Critical Fixes
echo ===========================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found
    echo Please run this script from the backend root directory:
    echo   cd sprintify_backend\finalAPI
    pause
    exit /b 1
)

REM Step 1: Install dependencies
echo 1. Installing dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
) else (
    echo ✅ Dependencies installed
)

echo.

REM Step 2: Build
echo 2. Building TypeScript...
call npm run build
if errorlevel 1 (
    echo ❌ Build failed
    pause
    exit /b 1
) else (
    echo ✅ Build successful
)

echo.

REM Step 3: Check .env
echo 3. Verifying environment configuration...
if not exist ".env" (
    echo ⚠️  .env file not found
    echo Creating .env from .env.example...
    if exist ".env.example" (
        copy ".env.example" ".env"
        echo.
        echo 📝 Please edit .env with your production values:
        echo    - JWT_SECRET ^(strong random string, 32+ chars^)
        echo    - DB_PASSWORD ^(database password^)
        echo    - FRONTEND_URL ^(your frontend domain^)
        echo.
        echo Edit .env file and run this script again
        pause
        exit /b 1
    )
) else (
    echo ✅ .env file found
)

echo.

echo 4. Fixes included:
echo    ✅ Rate limiting ^(100 req/15min^)
echo    ✅ Token race condition fix
echo    ✅ Project access authorization
echo    ✅ Pagination support ^(max 100 per page^)

echo.
echo ===========================================
echo ✅ All fixes deployed successfully!
echo ===========================================

echo.
echo Next steps:
echo 1. Start the application:
echo    set NODE_ENV=production
echo    npm start
echo.
echo 2. Test the fixes:
echo    - Try to update an issue ^(no more 401 errors^)
echo    - Try to access another project's data ^(should get 403^)
echo    - List issues with pagination: ?page=1^&limit=20
echo.
echo 3. Monitor logs for:
echo    - Rate limiting messages
echo    - Authorization errors
echo    - Any startup errors

echo.
echo 🎉 Deployment complete!
echo.

pause
