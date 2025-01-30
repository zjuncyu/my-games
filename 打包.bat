@echo off
chcp 65001
echo 正在创建自解压文件...

:: 设置7-Zip路径（修改这里为你的实际安装路径）
set ZIP_PATH="D:\Program Files\7-Zip\7z.exe"
:: 如果是其他路径，请相应修改，例如：
:: set ZIP_PATH="E:\7-Zip\7z.exe"

if not exist %ZIP_PATH% (
    echo 错误：未找到7-Zip，请确保已正确设置7-Zip路径
    echo 当前设置的路径是：%ZIP_PATH%
    echo 请修改批处理文件中的 ZIP_PATH 为正确的路径
    pause
    exit /b 1
)

:: 创建临时目录
if exist temp_package (
    rmdir /s /q temp_package
)
mkdir temp_package

:: 复制所需文件到临时目录
echo 正在复制文件...
copy /y index.html temp_package\ >nul
copy /y game.js temp_package\ >nul
copy /y game.hta temp_package\ >nul
if exist icon.ico copy /y icon.ico temp_package\ >nul
if exist highscore.txt copy /y highscore.txt temp_package\ >nul

:: 检查文件是否都存在
if not exist temp_package\index.html (
    echo 错误：未找到 index.html
    pause
    exit /b 1
)
if not exist temp_package\game.js (
    echo 错误：未找到 game.js
    pause
    exit /b 1
)
if not exist temp_package\game.hta (
    echo 错误：未找到 game.hta
    pause
    exit /b 1
)

:: 创建自解压包
echo 正在创建游戏包...
%ZIP_PATH% a -sfx7z.sfx game.exe temp_package\*

:: 检查是否成功创建
if exist game.exe (
    echo 打包成功！游戏文件已创建为 game.exe
) else (
    echo 错误：打包失败
)

:: 清理临时文件
echo 正在清理临时文件...
rmdir /s /q temp_package

echo.
echo 处理完成！
pause 