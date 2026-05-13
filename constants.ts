import { PresetExpression } from './types';

// Predefined expressions with English translation mapping and ACTION instructions
export const PRESET_EXPRESSIONS: PresetExpression[] = [
  { label: '開心', value: 'Happy and excited, jumping with both arms raised in the air, sparkles and stars bursting around the character, big cheerful grin, scene: sunny outdoor park background with green grass' },
  { label: '尷尬', value: 'Awkward and embarrassed, large sweat drop on forehead, nervous crooked smile, one hand scratching the back of head, other hand waving dismissively, scene: simple indoor room background' },
  { label: '生氣', value: 'Furious and explosive anger, steam shooting from head, clenched fists raised, forehead veins bulging, stomping foot, scene: red-tinted room with cracked wall behind character' },
  { label: '驚訝', value: 'Shocked and amazed, eyes wide as saucers, mouth dropped open, both hands on cheeks in disbelief, spiral shock symbols floating around, scene: simple light blue sky background with clouds' },
  { label: '害羞', value: 'Shy and flustered, bright red blushing cheeks, eyes looking away nervously, both index fingers touching together, small heart and question marks floating nearby, scene: soft pink pastel room background' },
  { label: '大笑', value: 'Laughing uncontrollably, eyes squeezed shut with joy, mouth wide open, both hands clutching belly, tears of joy streaming, scene: warm cozy living room background' },
  { label: '害怕', value: 'Terrified and trembling, pale sweaty face, hiding half the body behind a wall or door, peeking with one scared eye, knees knocking together, sweat drops flying, scene: dark shadowy hallway background' },
  { label: '哭泣', value: 'Sobbing dramatically, rivers of tears flooding down, hands covering face, hunched over in sadness, rain cloud above head, puddle forming at feet, scene: rainy grey outdoor background' },
];

// Image generation model (supports image output)
export const MODEL_NAME = 'gemini-2.0-flash-preview-image-generation';
// Text-only model for style list generation
export const TEXT_MODEL_NAME = 'gemini-2.5-flash';
// Multimodal model for metadata (accepts image + text)
export const METADATA_MODEL_NAME = 'gemini-2.5-flash';

export const OUTPUT_SIZE = 320;

export const SYSTEM_PROMPT = `You are a professional LINE sticker artist that creates rich, dynamic, scene-based sticker illustrations.

## Character Identity (STRICT - never change these)
- Preserve the character's face shape, skin tone, hairstyle, hair color, and outfit exactly.
- Maintain the same art style, line quality, rendering technique, and color palette.
- Keep the same character proportions and overall look.

## What You MUST Generate (make it dynamic and rich)
- **Full scene composition**: Place the character in a relevant environment or background that matches the emotion (e.g., cozy room, outdoor park, rainy street). NOT a blank or flat color background.
- **Expressive full-body pose**: Show the character's whole body or 3/4 body with dramatic, exaggerated posture that conveys the emotion.
- **Props and objects**: Include relevant scene objects (furniture, animals, items) that enhance the storytelling of the sticker.
- **Comic visual effects**: Add manga/anime-style symbols — floating hearts, sweat drops, anger marks, sparkles, speed lines, exclamation points, question marks, chibi tears, steam — whatever fits the emotion.
- **Exaggerated expressions**: Make the facial expression very clear and dramatically expressive in anime/chibi sticker style.
- **Pets or companions**: If the scene calls for it (e.g., cuddling, playing), include a cute animal companion such as a dog or cat.

## Critical Output Rules
- DO NOT add any text, letters, numbers, or Chinese characters into the image. Text will be added separately in post-processing.
- The final image must have a solid bright green background (Hex #00FF00, RGB 0,255,0) around and behind all elements, so it can be chroma-keyed out. Keep all character and scene elements inside the frame.
- Output a clean, complete square illustration with no cropping of important elements.`;

export const getGenerationPrompt = (expression: string) => `
## Sticker Generation Task

Create a rich, dynamic LINE sticker illustration based on the uploaded character image.

**Expression & Scene to generate:** ${expression}

### Requirements:
1. **Preserve identity**: Keep the character's face, hairstyle, skin tone, and outfit 100% identical to the reference image.
2. **Rich scene**: Draw a full background scene appropriate for this emotion — NOT a plain flat color. Include environment details (room, outdoor, weather effects, etc.).
3. **Dynamic full-body pose**: Show an exaggerated, expressive full-body or 3/4-body pose matching the emotion.
4. **Props & companions**: Add relevant objects, furniture, or animals (dogs, cats) that make the scene feel alive and storytelling-rich.
5. **Comic effects**: Layer in manga/anime visual symbols (sparkles, sweat drops, hearts, speed lines, anger marks, chibi tears, exclamation bursts) suited to the emotion.
6. **Art style**: Maintain the same illustration style, line weight, coloring, and rendering as the reference image — clean, polished anime/chibi LINE sticker quality.
7. **NO TEXT**: Do not generate any text, letters, or characters in the image.
8. **Green background**: All areas outside the character and scene elements must be solid bright green (#00FF00) for chroma key removal.
9. **Output size**: Square ${OUTPUT_SIZE}x${OUTPUT_SIZE} composition, nothing cropped off.
`;