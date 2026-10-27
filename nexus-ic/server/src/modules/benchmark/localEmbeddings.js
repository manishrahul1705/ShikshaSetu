import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const LOCAL_MODEL = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
export const LOCAL_MODEL_REVISION = '2c4055b12046f11709e9df2c122e59ffbdc2f900';
const modelRoot = fileURLToPath(new URL('./models/', import.meta.url));
const modelFile = fileURLToPath(new URL(`./models/${LOCAL_MODEL}/onnx/model_quantized.onnx`, import.meta.url));
const vectors = new Map(); // SHA-256 -> vector only; never retains complaint text.
const CAPACITY = 50000; // Engineering cache bound, not an AICTE policy threshold.
let extractor, queue = Promise.resolve(), state = 'NOT_LOADED', inferenceCalls = 0;
// Do not activate the unbenchmarked release experiment by default.
const disabled = () => process.env.JURY91_ENABLE_LOCAL_MODEL !== '1' || process.env.JURY91_DISABLE_LOCAL_MODEL === '1';
const key = text => createHash('sha256').update(String(text ?? '')).digest('hex');

async function load() {
  if (disabled()) { state = 'DISABLED'; return null; }
  if (!existsSync(modelFile)) { state = 'MODEL_FILES_MISSING'; return null; }
  if (!extractor) extractor = (async () => {
    try {
      const { env, pipeline } = await import('@huggingface/transformers');
      env.allowRemoteModels = false;
      env.allowLocalModels = true;
      env.localModelPath = modelRoot;
      env.useBrowserCache = false;
      env.useFSCache = false;
      const result = await pipeline('feature-extraction', LOCAL_MODEL, {
        local_files_only: true, dtype: 'q8', device: 'cpu',
        session_options: { intraOpNumThreads: 1, interOpNumThreads: 1 },
      });
      state = 'READY';
      return result;
    } catch { state = 'MODEL_LOAD_FAILED'; return null; }
  })();
  return extractor;
}

export async function prepareLocalSemantic(a, b) {
  if (disabled()) { state = 'DISABLED'; return; }
  const input = [...new Map([a?.narrative, b?.narrative].filter(text => typeof text === 'string' && text.trim()).map(text => [key(text), text])).entries()];
  if (!input.some(([hash]) => !vectors.has(hash))) return;
  const work = queue.then(async () => {
    const missing = input.filter(([hash]) => !vectors.has(hash));
    if (!missing.length) return;
    const featureExtractor = await load();
    if (!featureExtractor) return;
    try {
      const output = await featureExtractor(missing.map(([, text]) => text), { pooling: 'mean', normalize: true, truncation: true });
      const values = output.tolist();
      if (values.length !== missing.length) throw new Error('Unexpected vector count');
      for (let index = 0; index < missing.length; index++) {
        const vector = Float32Array.from(values[index]);
        if (!vector.length || !vector.every(Number.isFinite)) throw new Error('Invalid vector');
        if (vectors.size >= CAPACITY) vectors.delete(vectors.keys().next().value);
        vectors.set(missing[index][0], vector);
      }
      inferenceCalls++;
      state = 'READY';
    } catch { state = 'INFERENCE_FAILED'; }
  });
  queue = work.catch(() => {});
  await queue;
}

export function mappedCosine(a, b) {
  if (!a?.length || a.length !== b?.length) return null;
  let dot = 0, aa = 0, bb = 0;
  for (let index = 0; index < a.length; index++) { dot += a[index] * b[index]; aa += a[index] ** 2; bb += b[index] ** 2; }
  if (!aa || !bb) return null;
  return (Math.max(-1, Math.min(1, dot / Math.sqrt(aa * bb))) + 1) / 2;
}

export function localEmbeddingSimilarity(a, b) {
  if (disabled()) return { available: false, fallbackReason: 'MODEL_DISABLED' };
  const value = mappedCosine(vectors.get(key(a)), vectors.get(key(b)));
  return value === null ? { available: false, fallbackReason: state === 'READY' ? 'VECTOR_NOT_PREPARED' : state } : { available: true, value };
}

export function localModelStatus() {
  return { model: LOCAL_MODEL, revision: LOCAL_MODEL_REVISION, state, cacheEntries: vectors.size, inferenceCalls, offlineOnly: true };
}
