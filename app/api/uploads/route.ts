import { randomUUID } from 'node:crypto';
import { firestore } from '@/lib/firebase-admin';
import { uploadPhoto, deletePhoto } from '@/lib/cloudinary';
import { failure, sameOrigin, teacher } from '@/lib/server';

export const runtime = 'nodejs';
export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ error: 'Request not allowed.' }, { status: 403 });
  const user = await teacher();
  if (!user) return Response.json({ error: 'Your session expired. Sign in with Google again.' }, { status: 401 });
  if (Number(req.headers.get('content-length')) > 3500000) return Response.json({ error: 'Photo is too large.' }, { status: 413 });
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File) || file.type !== 'image/jpeg' || file.size > 3200000 || !file.size) {
      return Response.json({ error: 'Please upload a JPEG photo under 3 MB.' }, { status: 400 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255) return Response.json({ error: 'Invalid image file.' }, { status: 400 });
    const id = randomUUID();
    const url = await uploadPhoto(file, id);
    try {
      await firestore().collection('uploads').doc(id).create({ url, owner: user.uid, created_at: new Date().toISOString() });
    } catch (error) {
      // An unrecorded photo cannot be attached to a lesson. Remove it if possible.
      try { await deletePhoto(`notehub/${id}`); } catch { console.error('Notehub: an unused photo needs Cloudinary cleanup.'); }
      throw error;
    }
    return Response.json({ url }, { status: 201 });
  } catch (error) { return failure(error); }
}
