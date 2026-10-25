import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } from '../../shared/securityHeaders.ts';

/**
 * Reads a product photo and says which 3D model the browser should build.
 *
 * The 3D library holds a fixed set of parametric models. Until now the engine
 * guessed one from the product title; this endpoint looks at the picture
 * itself and picks the closest model, with the colours and proportions it
 * sees, so the viewer can build the shape on its own.
 *
 * Scoped on purpose: one image, a fixed model catalogue, a fixed output shape.
 */

const MODEL_CATALOGUE = [
  ['solar-panel', 'flat rectangular solar panel with cells and frame'],
  ['solar-battery', 'tall boxy deep-cycle battery with terminals'],
  ['laptop-elitebook', 'open business laptop computer'],
  ['laptop-ideapad', 'open consumer laptop computer'],
  ['phone-itel', 'smartphone handset'],
  ['phone-tecno', 'smartphone handset'],
  ['television', 'flat screen television'],
  ['speaker', 'large party speaker box'],
  ['blender', 'kitchen blender with jug and base'],
  ['fridge', 'refrigerator or freezer cabinet'],
  ['generator', 'portable petrol generator with frame and tank'],
  ['welder', 'welding machine box with cables'],
  ['maize-sheller', 'maize sheller machine with hopper and motor'],
  ['water-pump', 'water pump with motor and pipe outlets'],
  ['grinding-mill', 'grinding mill for cassava or grain with hopper'],
  ['block-machine', 'block making machine with mould and lever'],
  ['tyre', 'vehicle tyre'],
  ['brake-pads', 'set of brake pads'],
  ['roofing-sheet', 'corrugated metal roofing sheet'],
  ['cement-sack', 'paper cement sack'],
  ['carton', 'cardboard carton box'],
  ['sacks', 'woven polypropylene sacks'],
  ['dining-set', 'dining table with chairs'],
  ['sofa', 'upholstered sofa or couch'],
  ['basket', 'woven raffia basket'],
  ['cushions', 'decorative cushions'],
  ['shirt', 'folded or hanging shirt'],
  ['dress', 'african print dress'],
  ['hair-oil', 'bottle of hair oil'],
  ['cream-jar', 'jar or tub of body cream or shea butter'],
  ['bp-monitor', 'blood pressure monitor with cuff'],
  ['oximeter', 'pulse oximeter'],
];

const ALLOWED_KEYS = new Set(MODEL_CATALOGUE.map(([key]) => key));

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) {
      return addSecurityHeaders(Response.json({ error: 'Authentification requise' }, { status: 401 }));
    }

    const body = await req.json().catch(() => ({}));
    const imageUrl = typeof body?.image_url === 'string' ? body.image_url.trim() : '';
    const title = typeof body?.title === 'string' ? body.title.slice(0, 200) : '';
    if (!/^https:\/\/\S+$/i.test(imageUrl) || imageUrl.length > 1200) {
      return addSecurityHeaders(Response.json({ error: 'Lien de photo invalide' }, { status: 400 }));
    }

    const clientKey = getClientKey(req);
    const rateLimit = await checkRateLimit(base44.asServiceRole, clientKey || 'unidentified', {
      keyPrefix: 'detect_product_3d',
      failClosed: true,
      limit: clientKey ? 20 : 60,
      windowMs: 3600 * 1000,
    });
    if (!rateLimit.ok) return rateLimitErrorResponse(rateLimit);

    const catalogue = MODEL_CATALOGUE.map(([key, description]) => `- ${key}: ${description}`).join('\n');
    const prompt = [
      'You are a 3D model router for a marketplace product photo.',
      'Look at the product in the photo and decide which one of the fixed 3D models below can stand in for it.',
      '',
      catalogue,
      '',
      'Rules:',
      '- Choose exactly one model_key from the list. Never invent a key.',
      '- Judge the physical object, not the packaging or the brand. Two keys may describe the same object type (for example two phones): pick the first that fits.',
      '- If the photo holds no product that matches any model above, return model_key "none".',
      '- primary_color and secondary_color must be hex colours (#rrggbb) sampled from the product itself, never from the background, the wall or the watermark. primary_color is the body colour, secondary_color the trim, label or accent.',
      '- width_ratio, height_ratio and depth_ratio are the product proportions: divide each real dimension by the largest one, so the largest is 1.',
      '- confidence is 0 to 1 and reflects how sure you are of the model_key.',
      title ? `The listing title is: ${title}` : '',
      'Answer in French for object_name, category and material.',
    ].filter(Boolean).join('\n');

    const spec = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [imageUrl],
      response_json_schema: {
        type: 'object',
        properties: {
          object_name: { type: 'string' },
          category: { type: 'string' },
          material: { type: 'string' },
          model_key: { type: 'string' },
          confidence: { type: 'number' },
          primary_color: { type: 'string' },
          secondary_color: { type: 'string' },
          width_ratio: { type: 'number' },
          height_ratio: { type: 'number' },
          depth_ratio: { type: 'number' },
        },
        required: ['object_name', 'model_key', 'primary_color'],
      },
    });

    const key = typeof spec?.model_key === 'string' ? spec.model_key.trim() : '';
    if (!key || key === 'none' || !ALLOWED_KEYS.has(key)) {
      return addSecurityHeaders(Response.json({
        detected: false,
        object_name: typeof spec?.object_name === 'string' ? spec.object_name : '',
        reason: 'no_model',
      }));
    }

    const hex = (value, fallback) => {
      const match = typeof value === 'string' ? value.trim().match(/^#?([0-9a-f]{6})$/i) : null;
      return match ? `#${match[1].toLowerCase()}` : fallback;
    };
    const ratio = (value) => {
      const number = Number(value);
      return Number.isFinite(number) && number > 0 && number <= 1 ? number : null;
    };

    return addSecurityHeaders(Response.json({
      detected: true,
      model_key: key,
      object_name: typeof spec?.object_name === 'string' ? spec.object_name.slice(0, 120) : '',
      category: typeof spec?.category === 'string' ? spec.category.slice(0, 80) : '',
      material: typeof spec?.material === 'string' ? spec.material.slice(0, 80) : '',
      confidence: Math.max(0, Math.min(1, Number(spec?.confidence) || 0)),
      primary_color: hex(spec?.primary_color, null),
      secondary_color: hex(spec?.secondary_color, null),
      proportions: {
        width: ratio(spec?.width_ratio),
        height: ratio(spec?.height_ratio),
        depth: ratio(spec?.depth_ratio),
      },
    }));
  } catch (error) {
    return addSecurityHeaders(Response.json({ error: error.message }, { status: 500 }));
  }
}