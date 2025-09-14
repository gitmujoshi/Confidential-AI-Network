#!/bin/bash
set -e

echo "Starting Python training container..."
python train.py --config /app/config.json
