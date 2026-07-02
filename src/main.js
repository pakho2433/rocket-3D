const chunkUrls = [
  './builder.part0.b64',
  './builder.part1.b64',
  './builder.part2.b64',
  './builder.part3.b64',
  './builder.part4.b64',
].map((path) => new URL(path, import.meta.url));

async function boot() {
  try {
    if (!('DecompressionStream' in window)) {
      throw new Error('瀏覽器版本過舊，請更新 Safari 或 Chrome 後再試。');
    }

    const chunks = await Promise.all(
      chunkUrls.map(async (url) => {
        const response = await fetch(url, { cache: 'force-cache' });
        if (!response.ok) throw new Error(`無法載入遊戲資源：${url.pathname}`);
        return (await response.text()).trim();
      }),
    );

    const binary = atob(chunks.join(''));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const stream = new Blob([bytes])
      .stream()
      .pipeThrough(new DecompressionStream('gzip'));
    const source = await new Response(stream).text();
    const moduleUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));

    try {
      await import(moduleUrl);
    } finally {
      URL.revokeObjectURL(moduleUrl);
    }
  } catch (error) {
    console.error(error);
    const loading = document.querySelector('#loadingScreen');
    if (loading) loading.innerHTML = `<b>3D 遊戲載入失敗</b><span>${error.message}</span>`;
  }
}

boot();
