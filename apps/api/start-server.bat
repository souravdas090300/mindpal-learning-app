@echo off
echo.
echo ===================================================
echo   MindPal API - Starting Server
echo ===================================================
echo.
echo Make sure you have created the database tables!
echo.
echo If not, go to:
echo https://supabase.com/dashboard/project/qnzntcgtnivgxwijcevv/editor
echo.
echo And run the SQL from: prisma/create-tables.sql
echo.
echo ===================================================
echo.
echo Starting API server on port 3001...
echo.

npm run dev
