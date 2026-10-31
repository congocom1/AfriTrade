import { base44 } from '@/api/base44Client';

/**
 * Asks the detector which 3D model a product photo holds.
 *
 * The AI call runs in a backend function (Core integrations never run in the
 * browser). The answer is the model key the viewer builds, plus the colours
 * and the object name it read off the picture.
 */
export async function detectProduct3D({ imageUrl, title }) {
  const response = await base44.functions.invoke('detectProduct3D', {
    image_url: imageUrl,
    title: title || '',
  });
  const data = response?.data || {};

  if (!data.detected || !data.model_key) {
    return {
      detected: false,
      objectName: data.object_name || '',
      reason: data.reason || 'no_model',
    };
  }

  return {
    detected: true,
    modelKey: data.model_key,
    objectName: data.object_name || '',
    category: data.category || '',
    material: data.material || '',
    confidence: typeof data.confidence === 'number' ? data.confidence : 0,
    primaryColor: data.primary_color || null,
    secondaryColor: data.secondary_color || null,
  };
}