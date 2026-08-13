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