#!/usr/bin/env bash
# Aether-Ollama Setup Script
# Sets OLLAMA_ORIGINS=* so your browser can talk to your local Ollama.
# Safe: Ollama only listens on 127.0.0.1 — no external access is granted.

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "  Aether-Ollama Setup"
echo "  ==================="
echo ""

if ! command -v ollama &> /dev/null; then
  echo -e "${RED}✗ Ollama is not installed.${NC}"
  echo "  Install it first: https://ollama.com/download"
  exit 1
fi

# ── macOS ────────────────────────────────────────────────────────────────────
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo "  Detected: macOS"
  echo "  Setting OLLAMA_ORIGINS via launchctl..."
  launchctl setenv OLLAMA_ORIGINS "*"

  # Add to shell profile so it persists after reboot
  PROFILE="$HOME/.zshrc"
  [[ -f "$HOME/.bashrc" ]] && PROFILE="$HOME/.bashrc"
  if ! grep -q 'OLLAMA_ORIGINS' "$PROFILE" 2>/dev/null; then
    echo '' >> "$PROFILE"
    echo '# Aether-Ollama — allow browser access to local Ollama' >> "$PROFILE"
    echo 'export OLLAMA_ORIGINS="*"' >> "$PROFILE"
  fi

  # Restart Ollama menu bar app
  pkill -x Ollama 2>/dev/null || true
  sleep 1
  open -a Ollama 2>/dev/null || true

  echo -e "${GREEN}✓ Done!${NC} Reload ollama-chat.agkavin.dev in your browser."

# ── Linux (systemd) ──────────────────────────────────────────────────────────
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  echo "  Detected: Linux"

  # Detect systemd: check if unit file exists (works even if service is stopped)
  if systemctl list-unit-files ollama.service 2>/dev/null | grep -q ollama; then
    echo "  Configuring systemd service..."
    sudo mkdir -p /etc/systemd/system/ollama.service.d
    sudo tee /etc/systemd/system/ollama.service.d/ollama-origins.conf > /dev/null << 'EOF'
[Service]
Environment="OLLAMA_ORIGINS=*"
EOF
    sudo systemctl daemon-reload
    sudo systemctl restart ollama
    echo -e "${GREEN}✓ Done!${NC} Reload ollama-chat.agkavin.dev in your browser."

  else
    # No systemd unit — likely running Ollama manually
    echo -e "${YELLOW}⚠ No Ollama systemd service found.${NC}"
    echo "  Add this to your ~/.bashrc or ~/.zshrc:"
    echo '  export OLLAMA_ORIGINS="*"'
    echo "  Then restart Ollama."
  fi

else
  echo -e "${RED}✗ Unsupported OS.${NC}"
  echo "  Manually set the environment variable: OLLAMA_ORIGINS=\"*\""
  exit 1
fi

echo ""
