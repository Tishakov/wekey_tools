#!/bin/bash

# Массовое восстановление из резервных копий и правильная интеграция коин-системы

cd /c/projects/wekey_tools/frontend/src/pages

# Список файлов для восстановления
files=(
    "WordMixerTool.tsx"
    "DuplicateFinderTool.tsx" 
    "WordGluingTool.tsx"
)

echo "🔄 Восстанавливаю поломанные файлы из резервных копий..."

for file in "${files[@]}"; do
    if [ -f "${file}.backup" ]; then
        echo "📋 Восстанавливаю $file"
        cp "${file}.backup" "$file"
    else
        echo "⚠️  Резервная копия $file.backup не найдена"
    fi
done

echo "✅ Восстановление завершено!"