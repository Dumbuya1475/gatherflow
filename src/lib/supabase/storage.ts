
'use server';

import { createClient } from "./server";

export async function uploadFile(file: File, bucket: string): Promise<string> {
    const supabase = createClient();
    const filePath = `${bucket}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);
    
    if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

    if (!data || !data.publicUrl) {
         throw new Error("Failed to get public URL for the uploaded file.");
    }
    
    return data.publicUrl;
}
