/**
 * Dataset ingest allow-list (portal-honest PRD gap).
 * Reject pickle and other code-exec formats at upload, before files are persisted.
 */

const path = require('path');
const fs = require('fs');

const ALLOWED_EXTENSIONS = new Set([
  'csv',
  'tsv',
  'json',
  'jsonl',
  'txt',
  'parquet',
  'pq',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'gif',
  'bmp',
  'npy',
  'npz',
  'zip',
]);

const REJECTED_EXTENSIONS = new Set([
  'pkl',
  'pickle',
  'joblib',
  'p',
  'pt',
  'pth',
  'h5',
  'hdf5',
  'exe',
  'sh',
  'bat',
  'cmd',
  'ps1',
  'dll',
  'so',
  'dylib',
  'pyc',
  'py',
  'ipynb',
]);

const ACCEPT_ATTR = [...ALLOWED_EXTENSIONS].map((ext) => `.${ext}`).join(',');

function filenameExtensions(originalname) {
  const base = path.basename(String(originalname || '')).toLowerCase();
  const parts = base.split('.').filter(Boolean);
  return parts.slice(1);
}

function isPickleMagic(buffer) {
  if (!buffer || buffer.length < 2) return false;
  // Protocol 2+ pickle: 0x80 <proto>
  if (buffer[0] === 0x80 && buffer[1] <= 0x05) return true;
  return false;
}

function inspectFile(file) {
  const name = file.originalname || file.name || 'file';
  const exts = filenameExtensions(name);
  if (exts.length === 0) {
    return { name, allowed: false, reason: 'file has no extension; allowed ingest formats are csv, parquet, json, images, or zip' };
  }
  const rejected = exts.find((ext) => REJECTED_EXTENSIONS.has(ext));
  if (rejected) {
    return {
      name,
      allowed: false,
      reason:
        rejected === 'pkl' || rejected === 'pickle' || rejected === 'joblib' || rejected === 'p'
          ? 'pickle/joblib files are not allowed as dataset ingest (arbitrary code execution)'
          : `.${rejected} is not an allowed dataset ingest format`,
    };
  }
  const last = exts[exts.length - 1];
  const formatExt = last === 'gz' && exts.length > 1 ? exts[exts.length - 2] : last;
  if (!ALLOWED_EXTENSIONS.has(formatExt)) {
    return {
      name,
      allowed: false,
      reason: `.${formatExt} is not an allowed dataset ingest format (csv, parquet, json, images, zip)`,
    };
  }
  const diskPath = file.path;
  if (diskPath && fs.existsSync(diskPath)) {
    try {
      const fd = fs.openSync(diskPath, 'r');
      const buf = Buffer.alloc(8);
      const n = fs.readSync(fd, buf, 0, 8, 0);
      fs.closeSync(fd);
      if (n >= 2 && isPickleMagic(buf)) {
        return {
          name,
          allowed: false,
          reason: 'file content looks like a Python pickle; pickle is not allowed as dataset ingest',
        };
      }
    } catch (_) {
      // If we cannot sniff, extension allow-list still applies.
    }
  }
  return { name, allowed: true, reason: null };
}

function assertAllowedIngestFiles(files) {
  const list = Array.isArray(files) ? files : [];
  if (list.length === 0) {
    const err = new Error('No files to persist');
    err.statusCode = 400;
    throw err;
  }
  const rejected = [];
  for (const file of list) {
    const result = inspectFile(file);
    if (!result.allowed) rejected.push(result);
  }
  if (rejected.length > 0) {
    const detail = rejected.map((r) => `${r.name}: ${r.reason}`).join('; ');
    const err = new Error(`Dataset ingest rejected: ${detail}`);
    err.statusCode = 400;
    err.code = 'INGEST_FORMAT_REJECTED';
    err.rejected = rejected;
    throw err;
  }
  return true;
}

module.exports = {
  ALLOWED_EXTENSIONS,
  REJECTED_EXTENSIONS,
  ACCEPT_ATTR,
  filenameExtensions,
  inspectFile,
  assertAllowedIngestFiles,
};
