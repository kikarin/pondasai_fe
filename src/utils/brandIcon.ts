const ROUNDED_XL_RATIO = 12 / 48;

export function roundedIconRadius(size: number) {
  return Math.round(size * ROUNDED_XL_RATIO);
}

export function buildRoundedFaviconFromImage(iconUrl: string, size = 32): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas unavailable'));
        return;
      }

      const radius = roundedIconRadius(size);
      ctx.beginPath();
      ctx.roundRect(0, 0, size, size, radius);
      ctx.clip();
      ctx.drawImage(img, 0, 0, size, size);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load icon'));
    img.src = iconUrl;
  });
}
