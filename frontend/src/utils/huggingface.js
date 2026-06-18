/**
 * Extract normalized Hugging Face Hub references from catalog rows (mirrors backend service).
 */

export function extractHfFromDataset(dataset) {
  if (!dataset || typeof dataset !== 'object') return null;
  const meta = dataset.metadata && typeof dataset.metadata === 'object' ? dataset.metadata : {};
  if (meta.huggingface?.repoId) {
    return {
      repoType: 'dataset',
      repoId: String(meta.huggingface.repoId),
      splitTrain: meta.huggingface.splitTrain || 'train',
      splitTest: meta.huggingface.splitTest || 'test',
      sovereignty: meta.huggingface.sovereignty || 'hub-reference',
    };
  }
  if (meta.hfDatasetId) {
    return {
      repoType: 'dataset',
      repoId: String(meta.hfDatasetId),
      splitTrain: meta.splitTrain || 'train',
      splitTest: meta.splitTest || 'test',
      sovereignty: 'hub-reference',
    };
  }
  return null;
}

export function extractHfFromModel(model) {
  if (!model || typeof model !== 'object') return null;
  const meta = model.metadata && typeof model.metadata === 'object' ? model.metadata : {};
  if (meta.huggingface?.repoId) {
    return {
      repoType: 'model',
      repoId: String(meta.huggingface.repoId),
      sovereignty: meta.huggingface.sovereignty || 'hub-reference',
    };
  }
  if (meta.huggingfaceModel) {
    return { repoType: 'model', repoId: String(meta.huggingfaceModel), sovereignty: 'hub-reference' };
  }
  const arch = model.architecture ? String(model.architecture) : '';
  if (arch.includes('/')) {
    return { repoType: 'model', repoId: arch, sovereignty: 'hub-reference' };
  }
  return null;
}

export function huggingfaceHubUrl(ref) {
  if (!ref?.repoId) return null;
  const base = 'https://huggingface.co';
  return ref.repoType === 'dataset' ? `${base}/datasets/${ref.repoId}` : `${base}/${ref.repoId}`;
}

export function huggingfaceBadgeLabel(ref) {
  if (!ref?.repoId) return '';
  return `HF ${ref.repoId}`;
}
