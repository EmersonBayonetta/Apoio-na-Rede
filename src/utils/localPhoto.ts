// Normalize downloaded images before sending them through the registration API.
export async function readLocalPhoto(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw Error('Escolha uma imagem JPG, PNG ou WebP.');
  if (file.size > 10 * 1024 * 1024) throw Error('Escolha uma imagem de até 10 MB.');
  const bitmap = await createImageBitmap(file).catch(() => { throw Error('Não foi possível abrir esta imagem. Escolha outro arquivo.'); });
  try {
    const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw Error('Não foi possível preparar a imagem.');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.8, 0.6, 0.4]) {
      const photo = canvas.toDataURL('image/jpeg', quality);
      if (photo.length <= 280000) return photo;
    }
    throw Error('A imagem ainda está muito grande. Escolha uma imagem menor.');
  } finally { bitmap.close(); }
}
