import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file to JPG, targeting ≤1MB.
 * @param {File} file - The original image file
 * @returns {Promise<File>} - The compressed file
 */
export async function compressImage(file) {
    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/jpeg',
    };
    return imageCompression(file, options);
}

/**
 * Compresses an array of image files.
 * @param {File[]} files - Array of image files
 * @returns {Promise<File[]>} - Array of compressed files in same order
 */
export async function compressImages(files) {
    return Promise.all(files.map(compressImage));
}