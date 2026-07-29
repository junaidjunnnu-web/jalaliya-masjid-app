// Format phone number with India country code if missing
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remove any existing spaces or special characters except +
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // If already has country code (+91 or 91), return as is
  if (cleaned.startsWith('+91') || cleaned.startsWith('91')) {
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  }
  
  // Otherwise prepend +91
  return `+91${cleaned}`;
};
