#!/bin/bash
# Stone AI — Quick Deploy Script
# Запусти из папки stone-ai/

echo "🚀 Stone AI Deploy"
echo "==================="

# 1. Push to GitHub
echo ""
echo "📦 Pushing to GitHub..."
cd "$(dirname "$0")"
git branch -M main
git remote remove origin 2>/dev/null
git remote add origin https://github.com/dochstone/stone-ai.git
git push -u origin main

echo ""
echo "✅ Код на GitHub!"
echo ""
echo "📋 Теперь подключи Vercel:"
echo "1. Открой https://vercel.com/new"
echo "2. Import → dochstone/stone-ai"
echo "3. Root Directory: frontend"
echo "4. Framework: Vite"
echo "5. Deploy!"
