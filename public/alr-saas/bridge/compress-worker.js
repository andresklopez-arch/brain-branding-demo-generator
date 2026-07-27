const { parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const crypto = require('crypto');
const archiver = require('archiver');

const { targetPath, tempZipPath, encPath, customKey, defaultPassword } = workerData;

function encryptFile(inputPath, outputPath, keyText) {
  return new Promise((resolve, reject) => {
    try {
      const salt = crypto.randomBytes(16);
      const derived = crypto.pbkdf2Sync(keyText || defaultPassword, salt, 10000, 48, 'sha256');
      const key = derived.subarray(0, 32);
      const iv = derived.subarray(32, 48);

      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      const input = fs.createReadStream(inputPath);
      const output = fs.createWriteStream(outputPath);

      output.write(Buffer.from('ALRS', 'utf8'));
      output.write(salt);

      input.pipe(cipher).pipe(output);
      output.on('finish', resolve);
      output.on('error', reject);
      cipher.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

async function run() {
  const output = fs.createWriteStream(tempZipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', async () => {
    try {
      await encryptFile(tempZipPath, encPath, customKey);
      fs.unlinkSync(tempZipPath);
      parentPort.postMessage({ success: true });
    } catch (err) {
      if (fs.existsSync(tempZipPath)) { try { fs.unlinkSync(tempZipPath); } catch (e) {} }
      if (fs.existsSync(encPath)) { try { fs.unlinkSync(encPath); } catch (e) {} }
      parentPort.postMessage({ success: false, error: err.message });
    }
  });

  archive.on('error', (err) => {
    if (fs.existsSync(tempZipPath)) { try { fs.unlinkSync(tempZipPath); } catch (e) {} }
    parentPort.postMessage({ success: false, error: `Error de compresión: ${err.message}` });
  });

  archive.pipe(output);
  archive.directory(targetPath, false);
  archive.finalize();
}

run();
