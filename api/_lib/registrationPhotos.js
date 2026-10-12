import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

export function decodeRegistrationPhoto(value) {
  if (!value.startsWith('data:')) return null;
  if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length > 280000) throw Error('Arquivo de foto inválido ou muito grande.');
  const bytes = Buffer.from(value.slice(value.indexOf(',') + 1), 'base64');
  if (bytes.length < 4 || bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255 || bytes.at(-2) !== 255 || bytes.at(-1) !== 217) throw Error('Arquivo de foto inválido.');
  return bytes;
}

export async function storeRegistrationPhotos(root, secret, photos, fetchImpl) {
  const client = createClient(root, secret, { global: { fetch: fetchImpl }, auth: { persistSession: false, autoRefreshToken: false } });
  const bucket = 'place-photos';
  const paths = [];
  const cleanup = async () => { if (paths.length) await client.storage.from(bucket).remove(paths); };
  try {
    const { data, error } = await client.storage.getBucket(bucket);
    if (error) {
      const created = await client.storage.createBucket(bucket, { public: true, fileSizeLimit: 210000, allowedMimeTypes: ['image/jpeg'] });
      if (created.error) throw Error('Não foi possível preparar o armazenamento das fotos. Tente novamente.');
    } else if (!data.public) throw Error('O armazenamento das fotos precisa permitir a exibição pública.');
    const urls = [];
    for (const photo of photos) {
      const bytes = decodeRegistrationPhoto(photo);
      if (!bytes) { urls.push(photo); continue; }
      const path = `${randomUUID()}.jpg`;
      const result = await client.storage.from(bucket).upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
      if (result.error) throw Error('Não foi possível enviar a foto. Tente novamente.');
      paths.push(path);
      urls.push(client.storage.from(bucket).getPublicUrl(path).data.publicUrl);
    }
    return { urls, cleanup };
  } catch (error) { await cleanup().catch(() => {}); throw error; }
}
