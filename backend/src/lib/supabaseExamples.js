/**
 * Supabase Integration Examples
 * Demonstrates how to use Supabase in the Fafa Access application
 */

import { supabase } from '../lib/supabase.js';

// ============================================================================
// Storage Examples (File Uploads)
// ============================================================================

/**
 * Upload Ghana Card image to Supabase Storage
 * @param {File} file - File to upload
 * @param {string} applicationRef - Application reference for folder structure
 * @returns {Promise<{url: string, path: string, error: any}>}
 */
export async function uploadGhanaCardImage(file, applicationRef, side = 'front') {
  try {
    const fileName = `${applicationRef}/${side}-${Date.now()}.${file.name.split('.').pop()}`;
    const filePath = `ghana-cards/${fileName}`;

    const { error } = await supabase.storage
      .from('documents') // Create this bucket in Supabase Storage
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      return { error };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath,
      error: null
    };
  } catch (error) {
    return { error };
  }
}

/**
 * Upload student selfie to Supabase Storage
 */
export async function uploadStudentSelfie(file, applicationRef) {
  const fileName = `${applicationRef}/selfie-${Date.now()}.${file.name.split('.').pop()}`;
  const filePath = `selfies/${fileName}`;

  const { error } = await supabase.storage
    .from('documents')
    .upload(filePath, file);

  if (error) return { error };

  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath);

  return {
    url: urlData.publicUrl,
    path: filePath,
    error: null
  };
}

/**
 * Upload admission letter to Supabase Storage
 */
export async function uploadAdmissionLetter(file, applicationRef) {
  const fileName = `${applicationRef}/admission-${Date.now()}.pdf`;
  const filePath = `admission-letters/${fileName}`;

  const { error } = await supabase.storage
    .from('documents')
    .upload(filePath, file, {
      contentType: 'application/pdf'
    });

  if (error) return { error };

  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath);

  return {
    url: urlData.publicUrl,
    path: filePath,
    error: null
  };
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteDocument(filePath) {
  const { data, error } = await supabase.storage
    .from('documents')
    .remove([filePath]);

  return { data, error };
}

/**
 * Get signed URL for private document (expires after duration)
 */
export async function getSignedUrl(filePath, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, expiresIn);

  return { url: data?.signedUrl, error };
}

// ============================================================================
// Database Examples (if using Supabase Postgres instead of local)
// ============================================================================

/**
 * Query applications from Supabase database
 * NOTE: Only use if you migrate from local Postgres to Supabase Postgres
 */
export async function getApplicationsFromSupabase(studentId) {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      student_profiles (
        full_name,
        university_id
      ),
      laptops (
        model,
        brand,
        price
      )
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  return { data, error };
}

/**
 * Insert application to Supabase database
 */
export async function createApplicationInSupabase(applicationData) {
  const { data, error } = await supabase
    .from('applications')
    .insert([applicationData])
    .select()
    .single();

  return { data, error };
}

/**
 * Update application status
 */
export async function updateApplicationStatusInSupabase(applicationId, newStatus) {
  const { data, error } = await supabase
    .from('applications')
    .update({ 
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', applicationId)
    .select()
    .single();

  return { data, error };
}

// ============================================================================
// Real-time Subscriptions
// ============================================================================

/**
 * Subscribe to application status changes
 * Useful for real-time dashboard updates
 */
export function subscribeToApplicationChanges(applicationId, callback) {
  const subscription = supabase
    .channel(`application-${applicationId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'applications',
        filter: `id=eq.${applicationId}`
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Subscribe to new applications for SRC dashboard
 */
export function subscribeToNewApplications(universityId, callback) {
  const subscription = supabase
    .channel('new-applications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'applications',
        filter: `university_id=eq.${universityId}`
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

// ============================================================================
// Integration with Express Controllers
// ============================================================================

/**
 * Example: Upload documents during application submission
 */
export async function handleDocumentUploads(req, res) {
  try {
    const { applicationRef } = req.body;
    const files = req.files; // Using multer

    // Upload Ghana Card front
    const frontResult = await uploadGhanaCardImage(
      files.ghanaCardFront[0],
      applicationRef,
      'front'
    );
    
    if (frontResult.error) {
      return res.status(500).json({ 
        error: 'Failed to upload Ghana Card front image' 
      });
    }

    // Upload Ghana Card back
    const backResult = await uploadGhanaCardImage(
      files.ghanaCardBack[0],
      applicationRef,
      'back'
    );

    if (backResult.error) {
      return res.status(500).json({ 
        error: 'Failed to upload Ghana Card back image' 
      });
    }

    // Upload selfie
    const selfieResult = await uploadStudentSelfie(
      files.selfie[0],
      applicationRef
    );

    if (selfieResult.error) {
      return res.status(500).json({ 
        error: 'Failed to upload selfie' 
      });
    }

    // Return uploaded file URLs
    res.json({
      success: true,
      data: {
        ghanaCardFront: frontResult.url,
        ghanaCardBack: backResult.url,
        selfie: selfieResult.url
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ============================================================================
// Storage Bucket Setup Instructions
// ============================================================================

/**
 * TO SET UP STORAGE IN SUPABASE:
 * 
 * 1. Go to: https://dhqbqkwcsrnpzskchpje.supabase.co/storage/buckets
 * 
 * 2. Create a new bucket named "documents":
 *    - Click "Create bucket"
 *    - Name: documents
 *    - Public bucket: Yes (if you want public URLs) or No (use signed URLs)
 *    - File size limit: 50MB (adjust as needed)
 * 
 * 3. Set up folder structure (optional):
 *    - ghana-cards/
 *    - selfies/
 *    - admission-letters/
 * 
 * 4. Configure Storage Policies (if using authenticated access):
 *    Go to Storage > Policies and add:
 * 
 *    Policy for SELECT (Download):
 *    ```sql
 *    CREATE POLICY "Allow authenticated users to download"
 *    ON storage.objects FOR SELECT
 *    TO authenticated
 *    USING (bucket_id = 'documents');
 *    ```
 * 
 *    Policy for INSERT (Upload):
 *    ```sql
 *    CREATE POLICY "Allow authenticated users to upload"
 *    ON storage.objects FOR INSERT
 *    TO authenticated
 *    WITH CHECK (bucket_id = 'documents');
 *    ```
 * 
 *    Policy for DELETE:
 *    ```sql
 *    CREATE POLICY "Allow users to delete own files"
 *    ON storage.objects FOR DELETE
 *    TO authenticated
 *    USING (bucket_id = 'documents');
 *    ```
 * 
 * 5. For public access (no auth required), use:
 *    ```sql
 *    CREATE POLICY "Public Access"
 *    ON storage.objects FOR SELECT
 *    TO public
 *    USING (bucket_id = 'documents');
 *    ```
 */

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get file size from Supabase Storage
 */
export async function getFileSize(filePath) {
  const { data, error } = await supabase.storage
    .from('documents')
    .list(filePath.split('/')[0], {
      search: filePath.split('/').slice(1).join('/')
    });

  if (error || !data?.[0]) return { error };

  return { size: data[0].metadata.size, error: null };
}

/**
 * List all files for an application
 */
export async function listApplicationDocuments(applicationRef) {
  const { data, error } = await supabase.storage
    .from('documents')
    .list(`ghana-cards/${applicationRef}`);

  return { data, error };
}

export default {
  uploadGhanaCardImage,
  uploadStudentSelfie,
  uploadAdmissionLetter,
  deleteDocument,
  getSignedUrl,
  subscribeToApplicationChanges,
  subscribeToNewApplications,
  getFileSize,
  listApplicationDocuments
};
