#!/bin/bash
exec "$(dirname "$0")/scripts/startup/stop-system.sh" "$@"
