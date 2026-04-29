#!/usr/bin/env node

const { spawnSync } = require('child_process');
const { mkdirSync } = require('fs');
const { join } = require('path');

const args = process.argv.slice(2);
const logDir = process.env.CLAUDE_MEM_LOG_DIR
  || join(process.cwd(), '.tmp', 'test-logs', `${Date.now()}-${process.pid}`);

mkdirSync(logDir, { recursive: true });

const result = spawnSync('bun', ['test', '--parallel=1', ...args], {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: {
    ...process.env,
    CLAUDE_MEM_LOG_DIR: logDir,
  },
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
