// Record the actual Chrome viewport using its installed WebM encoder.
// The caller installs the privacy guard before navigating the recorded page.
const fs = require('node:fs/promises');
async function startRecording(browser, page, filename) {
  const encoderContext = await browser.newContext();
  const encoder = await encoderContext.newPage();
  const chunks = [];
  await encoder.exposeBinding('saveChunk', (_, data) => chunks.push(Buffer.from(data, 'base64')));
  await encoder.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1366; canvas.height = 768;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const recorder = new MediaRecorder(canvas.captureStream(8), { mimeType: 'video/webm;codecs=vp8' });
    const pending = [];
    recorder.ondataavailable = event => {
      if (!event.data.size) return;
      pending.push(new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => window.saveChunk(reader.result.split(',')[1]).then(resolve, reject);
        reader.readAsDataURL(event.data);
      }));
    };
    window.drawFrame = async data => {
      const img = new Image(); img.src = `data:image/jpeg;base64,${data}`;
      await img.decode(); ctx.fillRect(0, 0, canvas.width, canvas.height);
      const ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
      ctx.drawImage(img, 0, 0, img.width * ratio, img.height * ratio);
    };
    window.stopRecording = () => new Promise(resolve => {
      recorder.onstop = async () => { await Promise.all(pending); resolve(); };
      recorder.stop();
    });
    recorder.start(1000);
  });
  const cdp = await page.context().newCDPSession(page);
  let frames = 0, failure, drawing = Promise.resolve();
  cdp.on('Page.screencastFrame', frame => {
    drawing = drawing.then(async () => {
      await encoder.evaluate(data => window.drawFrame(data), frame.data);
      frames++;
    }).catch(error => { failure = error; }).finally(() => cdp.send('Page.screencastFrameAck', { sessionId: frame.sessionId }).catch(() => {}));
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 70, maxWidth: 1366, maxHeight: 768, everyNthFrame: 2 });
  return async () => {
    try {
      await cdp.send('Page.stopScreencast'); await drawing;
      await encoder.evaluate(() => window.stopRecording());
      if (failure) throw failure;
      if (!frames || !chunks.length) throw new Error('Browser recording produced no frames');
      await fs.writeFile(filename, Buffer.concat(chunks));
      return { frames, bytes: chunks.reduce((sum, chunk) => sum + chunk.length, 0), encoder: 'Chrome MediaRecorder VP8' };
    } finally { await cdp.detach(); await encoderContext.close(); }
  };
}
module.exports = { startRecording };
