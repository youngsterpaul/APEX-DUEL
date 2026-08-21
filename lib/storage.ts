import { supabase } from './supabaseClient';

const GAME_BUCKET = 'game-images';
const LISTING_BUCKET = 'account-photos';

export async function uploadGameImage(gameId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${gameId}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(GAME_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(GAME_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteGameImage(path: string): Promise<void> {
  const { error } = await supabase.storage.from(GAME_BUCKET).remove([path]);
  if (error) throw error;
}

export async function uploadListingPhoto(sellerId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${sellerId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(LISTING_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(LISTING_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

const EVENT_BUCKET = 'event-images';

/** Uploads a background photo for a duel, league, or tournament. Returns a public URL. */
export async function uploadEventImage(kind: 'duel' | 'league' | 'tournament', ownerId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${kind}/${ownerId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(EVENT_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(EVENT_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

const EVIDENCE_BUCKET = 'transfer-evidence';

/** Uploads a piece of dispute evidence (screenshot, proof of ownership, etc). Bucket is private — only signed-in users can read/write. */
export async function uploadTransferEvidence(transferId: string, uploaderId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${transferId}/${uploaderId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });
  if (uploadError) throw uploadError;

  // Bucket is private — store a signed URL valid for a year so it renders in the chat/dispute UI.
  const { data, error } = await supabase.storage.from(EVIDENCE_BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365);
  if (error) throw error;
  return data.signedUrl;
}