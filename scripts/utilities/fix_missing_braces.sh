#!/bin/bash

# Исправляем отсутствующие закрывающие скобки после requireAuth()

FILES=(
    "TextGeneratorTool.tsx"
    "AddSymbolTool.tsx" 
    "CaseChangerTool.tsx"
    "WordMixerTool.tsx"
    "MinusWordsTool.tsx"
    "EmojiTool.tsx"
    "AnalyticsTool.tsx"
)

BASE_DIR="/c/projects/wekey_tools/frontend/src/pages"

for file in "${FILES[@]}"; do
    filepath="$BASE_DIR/$file"
    echo "Processing $file..."
    
    if [ -f "$filepath" ]; then
        # Исправляем отсутствующую закрывающую скобку после requireAuth
        sed -i 's/return; \/\/ Если пользователь не авторизован, показываем модальное окно и прерываем выполнение$/&\n        }/' "$filepath"
        echo "  ✓ Fixed missing closing brace in $file"
    else
        echo "  ✗ File not found: $filepath"
    fi
done

echo "Done!"