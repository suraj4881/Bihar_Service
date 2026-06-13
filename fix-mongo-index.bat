@echo off
echo Fixing MongoDB Index Conflict...
echo.

mongosh bihar_seva --eval "db.users.dropIndex('phone')"

echo.
echo Done! Now restart backend.
pause

