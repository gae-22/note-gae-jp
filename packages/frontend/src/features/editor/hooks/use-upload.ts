import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useUpload() {
    const [isUploading, setIsUploading] = useState(false);

    const upload = useCallback(async (file: File): Promise<string | null> => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            return data.data.url;
        } catch {
            toast.error('Failed to upload file');
            return null;
        } finally {
            setIsUploading(false);
        }
    }, []);

    return { upload, isUploading };
}
