#!/bin/bash
# Simpel push script

cd "$(dirname "$0")"

echo "📝 Wat heb je aangepast?"
read -p "Commit message: " message

echo ""
echo "🔍 Deze bestanden worden gepusht:"
git status --short

echo ""
read -p "Doorgaan? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    git add .
    git commit -m "$message"
    git push
    echo ""
    echo "✅ Gepusht naar GitHub!"
    echo "🌐 Over 1-2 minuten live op: https://tallewoutertest.github.io/cycling-fantasy-game/"
else
    echo "❌ Geannuleerd"
fi
