// lib/supabase/storage.ts
import { createClient } from '@/lib/supabase/server';

export async function uploadFile(file: File, bucket: string): Promise<{ publicUrl: string | null, error: { message: string } | null }> {
  const supabase = createClient();
  
  if (!file) {
    return { publicUrl: null, error: { message: 'No file provided' } };
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = fileName;

  console.log(`Uploading file to bucket: ${bucket}, path: ${filePath}`);

  // Upload file
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Storage upload error:', error);
    return { publicUrl: null, error: { message: `Upload failed: ${error.message}` } };
  }

  if (!data) {
    return { publicUrl: null, error: { message: 'Upload failed: No data returned' } };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  if (!urlData || !urlData.publicUrl) {
    return { publicUrl: null, error: { message: 'Failed to get public URL' } };
  }

  console.log('File uploaded successfully:', urlData.publicUrl);
  return { publicUrl: urlData.publicUrl, error: null };
}

export async function deleteFile(bucket: string, filePath: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
  
    if (error) {
      console.error('Storage delete error:', error);
      // We don't throw an error here because we don't want to fail the whole transaction
      // if the old image fails to delete.
    }
  }
