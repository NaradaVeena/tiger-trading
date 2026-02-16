#!/bin/bash
# Sync framework docs to portal for live viewing
RAW="/home/vamsi/tiger-trading/research/aiportfolio/raw"
mkdir -p "$RAW"
cp /home/vamsi/tiger-trading/portfolio/TRADE-SELECTION.md "$RAW/"
cp /home/vamsi/tiger-trading/portfolio/REGIME-DETECTION.md "$RAW/"
cp /home/vamsi/tiger-trading/portfolio/RULES.md "$RAW/"
cp /home/vamsi/.openclaw/workspace/contexts/tiger/CONTEXT.md "$RAW/"
cp /home/vamsi/.openclaw/workspace/contexts/tiger/learnings.md "$RAW/"
cp /home/vamsi/.openclaw/workspace/skills/technical-analysis-mtf/SKILL.md "$RAW/SKILL-MTF.md"

# Export regime data from DB to JSON for portal
cd /home/vamsi/tiger-trading && node scripts/export-regime.js
