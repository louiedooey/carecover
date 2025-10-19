/**
 * Converts MIME types to user-friendly short names
 */
export const getFileTypeDisplay = (mimeType: string): string => {
  // Handle common document types
  if (mimeType.includes('pdf')) {
    return 'PDF';
  }
  
  if (mimeType.includes('wordprocessingml.document') || mimeType.includes('msword')) {
    return 'DOCX';
  }
  
  if (mimeType.includes('document') && mimeType.includes('msword')) {
    return 'DOC';
  }
  
  // Handle image types
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
    return 'JPG';
  }
  
  if (mimeType.includes('png')) {
    return 'PNG';
  }
  
  if (mimeType.includes('gif')) {
    return 'GIF';
  }
  
  if (mimeType.includes('webp')) {
    return 'WEBP';
  }
  
  // Handle other common types
  if (mimeType.includes('text/plain')) {
    return 'TXT';
  }
  
  if (mimeType.includes('text/csv')) {
    return 'CSV';
  }
  
  if (mimeType.includes('spreadsheetml') || mimeType.includes('excel')) {
    return 'XLSX';
  }
  
  if (mimeType.includes('presentationml') || mimeType.includes('powerpoint')) {
    return 'PPTX';
  }
  
  // Fallback: extract extension from MIME type or return generic
  const parts = mimeType.split('/');
  if (parts.length > 1) {
    const subtype = parts[1].split(';')[0]; // Remove any parameters
    return subtype.toUpperCase();
  }
  
  return 'FILE';
};
