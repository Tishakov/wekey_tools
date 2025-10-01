#!/bin/bash

# Скрипт для исправления дублирования incrementAndGetCount в инструментах

FILES=(
    "WordMixerTool.tsx"
    "WordInflectionTool.tsx" 
    "WordGluingTool.tsx"
    "TransliterationTool.tsx"
    "TextToHtmlTool.tsx"
    "TextSortingTool.tsx"
    "TextOptimizerTool.tsx"
    "TextGeneratorTool.tsx"
    "TextByColumnsTool.tsx"
    "SynonymGeneratorTool.tsx"
    "SpacesToParagraphsTool.tsx"
    "RemoveLineBreaksTool.tsx"
    "MinusWordsTool.tsx"
    "MatchTypesTool.tsx"
    "FindReplaceTool.tsx"
    "EmptyLinesRemovalTool.tsx"
    "DuplicateRemovalTool.tsx"
    "CharCounterTool.tsx"
    "CaseChangerTool.tsx"
    "AnalyticsTool.tsx"
)

BASE_DIR="/c/projects/wekey_tools/frontend/src/pages"

for file in "${FILES[@]}"; do
    filepath="$BASE_DIR/$file"
    echo "Processing $file..."
    
    if [ -f "$filepath" ]; then
        # Удаляем первый блок с incrementAndGetCount в секции авторизации
        sed -i '/Увеличиваем счетчик запусков$/,/setLaunchCount(prev => prev + 1);$/d' "$filepath"
        echo "  ✓ Removed duplicate incrementAndGetCount from $file"
    else
        echo "  ✗ File not found: $filepath"
    fi
done

echo "Done!"