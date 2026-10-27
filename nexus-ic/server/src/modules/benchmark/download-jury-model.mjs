import { mkdir, writeFile, stat, rename, rm } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Explicitly invoked, one-time approved download. Application startup never downloads.
const model = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
const revision = '2c4055b12046f11709e9df2c122e59ffbdc2f900';
const directory = fileURLToPath(new URL(`./models/${model}/`, import.meta.url));
const files = [
  ['onnx/model_quantized.onnx', 118308126, '66fc00f5f29afcaff34092e1bdd20008ca3918265a82fb9695a551e510cc4ebc'],
  ['tokenizer.json', 17082913, 'b60b6b43406a48bf3638526314f3d232d97058bc93472ff2de930d43686fa441'],
  ['config.json', 673], ['special_tokens_map.json', 280], ['tokenizer_config.json', 496],
];
const manifest = { model, revision, downloadedAt: new Date().toISOString(), files: [] };
for (const [name, bytes, expectedHash] of files) {
  const target = path.join(directory, name), temporary = `${target}.partial`;
  await mkdir(path.dirname(target), { recursive: true });
  const response = await fetch(`https://huggingface.co/${model}/resolve/${revision}/${name}`);
  if (!response.ok) throw new Error(`Model download failed (${response.status}) for ${name}`);
  try {
    await pipeline(Readable.fromWeb(response.body), createWriteStream(temporary));
    if ((await stat(temporary)).size !== bytes) throw new Error(`Model size mismatch: ${name}`);
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(temporary)) hash.update(chunk);
    const sha256 = hash.digest('hex');
    if (expectedHash && sha256 !== expectedHash) throw new Error(`Model digest mismatch: ${name}`);
    await rename(temporary, target);
    manifest.files.push({ name, bytes, sha256 });
    console.log(`Verified model file: ${name} (${bytes} bytes)`);
  } catch (error) { await rm(temporary, { force: true }); throw error; }
}
await writeFile(path.join(directory, 'jury91-manifest.json'), JSON.stringify(manifest, null, 2));
console.log('Approved model download complete. Runtime inference must remain offline.');
