const chunkUrls = [
  './runtime.part0.b64',
  './runtime.part1.b64',
  './runtime.part2.b64',
  './runtime.part3a.b64',
  './runtime.part3b.b64',
  './runtime.part3c.b64',
  './runtime.part3d.b64',
];

async function boot() {
  try {
    if (!('DecompressionStream' in window)) {
      throw new Error('瀏覽器版本過舊，請更新 Safari 或 Chrome 後再試。');
    }

    const chunks = await Promise.all(
      chunkUrls.map(async (url) => {
        const response = await fetch(url, { cache: 'force-cache' });
        if (!response.ok) throw new Error(`無法載入遊戲資源：${url}`);
        return (await response.text()).trim();
      }),
    );

    const binary = atob(chunks.join(''));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const decompressed = new Blob([bytes])
      .stream()
      .pipeThrough(new DecompressionStream('gzip'));
    const source = await new Response(decompressed).text();
    const moduleUrl = URL.createObjectURL(
      new Blob([source], { type: 'text/javascript' }),
    );

    try {
      await import(moduleUrl);
    } finally {
      URL.revokeObjectURL(moduleUrl);
    }
  } catch (error) {
    console.error(error);
    const loading = document.querySelector('#loadingScreen');
    if (loading) {
      loading.innerHTML = `<strong>遊戲載入失敗</strong><small>${error.message}</small>`;
    }
  }
}

boot();
