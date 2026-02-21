import OpenAI from 'openai';
import { put } from '@vercel/blob';

const openai = new OpenAI();

interface CharacterImageInput {
    name?: string;
    race?: string;
    description?: string;
    backstory?: string;
    setting?: {
        name?: string;
        genres?: string[];
        system_message?: string;
        key_themes?: ({ theme: string } | string)[];
        major_locations?: Record<string, { name: string }>;
        rules?: ({ rule: string } | string)[];
    };
}

export async function generatePortrait(input: CharacterImageInput): Promise<string | null> {
    try {
        const { name, race, description, backstory, setting } = input;

        const settingContext = [
            setting?.name ? `Setting name: ${setting.name}` : null,
            setting?.genres?.length ? `Genre: ${setting.genres.join(', ')}` : null,
            setting?.system_message ? `Setting description: ${setting.system_message.slice(0, 400)}` : null,
            setting?.key_themes?.length ? `Themes: ${setting.key_themes.slice(0, 4).map((t: any) => t.theme ?? t).join(', ')}` : null,
            setting?.major_locations ? `Locations: ${Object.values(setting.major_locations).slice(0, 3).map((l: any) => l.name).join(', ')}` : null,
            setting?.rules?.length ? `World rules: ${setting.rules.slice(0, 2).map((r: any) => r.rule ?? r).join(', ')}` : null,
        ].filter(Boolean).join('\n');

        // Infer gender from description/backstory pronouns so the image model gets an unambiguous subject line
        const combinedText = `${description ?? ''} ${backstory ?? ''}`.toLowerCase();
        const sheCount = (combinedText.match(/\bshe\b|\bher\b|\bhers\b|\bherself\b/g) ?? []).length;
        const heCount  = (combinedText.match(/\bhe\b|\bhim\b|\bhis\b|\bhimself\b/g) ?? []).length;
        const theyCount = (combinedText.match(/\bthey\b|\bthem\b|\btheir\b/g) ?? []).length;
        let genderLabel = 'person';
        let genderPronoun = 'they';
        if (sheCount > heCount && sheCount > theyCount) { genderLabel = 'woman'; genderPronoun = 'she'; }
        else if (heCount > sheCount && heCount > theyCount) { genderLabel = 'man'; genderPronoun = 'he'; }

        const summaryCompletion = await openai.chat.completions.create({
            model: 'gpt-5-mini',
            messages: [
                {
                    role: 'system',
                    content:
                        'You write safe, purely visual descriptions for a character portrait illustration. ' +
                        'The output will be sent directly to an image generation model and MUST pass content moderation — keep everything family-friendly and visually positive.\n\n' +
                        'CRITICAL — PRESERVE EVERY SPECIFIC VISUAL DETAIL: You MUST extract and reproduce EVERY specific visual attribute mentioned in the description verbatim. ' +
                        'This includes exact hair colour (e.g. "vibrant green hair"), exact eye colour (e.g. "piercing silver eyes"), exact clothing colours and styles (e.g. "flowing blue robes"), and ALL supernatural or unusual visual traits. ' +
                        'Never substitute a specific colour or trait with a generic one. If the description says green hair, the output MUST say green hair. If it says blue robes, the output MUST say blue robes. ' +
                        'Treat the description as ground truth for every visual attribute.\n\n' +
                        'CRITICAL — GENDER: The character\'s gender must be preserved exactly as described. ' +
                        `This character is a ${genderLabel} (pronouns: ${genderPronoun}). ` +
                        'The APPEARANCE line must begin with the gender word (e.g. "A young woman with..." or "A tall man with..."). Never swap the gender.\n\n' +
                        'CRITICAL — RACE GROUNDING: Interpret the character\'s race within the setting, not as a generic fantasy trope. ' +
                        '"Half-blood" in a wizarding school = ordinary human with subtle magical heritage. ' +
                        '"Fremen" in a desert sci-fi world = human with striking blue eyes from spice. ' +
                        'Ground physical traits in what that lineage actually looks like in this world.\n\n' +
                        'SAFETY RULES (non-negotiable):\n' +
                        '- Describe ONLY positive visual features: face shape, hair, eye colour, clothing, accessories, posture\n' +
                        '- NEVER mention: weapons drawn ready to attack, blood, wounds, death, darkness, evil, horror, menace, undead, demons, nudity, or anything disturbing\n' +
                        '- Clothing/armour is fine to mention (e.g. "leather armour", "flowing robes") but no gore or threat language\n' +
                        '- Cultural markings or tattoos are fine if described neutrally (e.g. "geometric tattoo on cheek")\n\n' +
                        '1. APPEARANCE: 1–2 sentences — start with gender ("A [woman/man/person] with..."), then include EVERY specific detail from the description: face, build, exact hair colour, exact eye colour, skin tone, outfit. Strictly visual. Preserve all unusual/supernatural visual traits exactly.\n' +
                        '2. WORLD: 1 sentence — visual aesthetic, colour palette, architecture, atmosphere. No real IP names.\n' +
                        '3. LOCATION: 1 sentence — a visually interesting background location suited to the character. No IP names.\n' +
                        '4. ART_STYLE: Exactly 1 sentence — describe how this image should look as if it were a panel or still frame from INSIDE this specific world, not a generic painting.\n' +
                        'Examples (use as guides, match to the actual setting):\n' +
                        '   - Marvel/DC superheroes: "Crisp comic book panel, bold ink outlines, clean flat colour fills, sharp halftone shading, dynamic hero pose"\n' +
                        '   - Harry Potter / wizarding school: "Cinematic British fantasy film still, photorealistic, warm golden studio lighting, soft depth of field"\n' +
                        '   - Sci-fi / space opera: "Cinematic sci-fi film still, photorealistic, sharp futuristic costume, dramatic rim lighting"\n' +
                        '   - Cyberpunk: "Cinematic cyberpunk film still, photorealistic, electric neon reflections, rain-wet surfaces, depth of field"\n' +
                        '   - Anime / manga: "High-quality anime key visual, crisp cel-shading, clean sharp ink lines, vivid saturated flat colours"\n' +
                        '   - Dark fantasy / gothic: "Cinematic dark fantasy film still, photorealistic, brooding atmospheric shadows, detailed armour"\n' +
                        '   - Western / frontier: "Cinematic Western film still, photorealistic, warm dusty amber light, sun-weathered textures"\n' +
                        '   - Historical / period drama: "Cinematic historical drama film still, photorealistic, natural warm period lighting, detailed costume"\n' +
                        '   - Post-apocalyptic: "Cinematic post-apocalyptic film still, photorealistic, harsh desaturated sunlight, weathered textures"\n' +
                        '   - Modern / contemporary: "Cinematic photorealistic portrait, natural lighting, shallow depth of field"\n' +
                        'Output format: APPEARANCE: <text> | WORLD: <text> | LOCATION: <text> | ART_STYLE: <text>',
                },
                {
                    role: 'user',
                    content: [
                        `Name: ${name || 'Unknown'}`,
                        `Gender: ${genderLabel}`,
                        `Race/Lineage: ${race || 'Human'}`,
                        description ? `Description: ${description}` : null,
                        backstory ? `Backstory (extract visual/physical details only):\n${backstory}` : null,
                        settingContext ? `\nSetting context:\n${settingContext}` : null,
                    ].filter(Boolean).join('\n'),
                },
            ],
            max_completion_tokens: 700,
        } as any);

        const rawSummary = summaryCompletion.choices[0]?.message?.content?.trim() ?? '';
        const appearanceMatch = rawSummary.match(/APPEARANCE:\s*([\s\S]+?)(?:\s*\|\s*WORLD:|$)/);
        const worldMatch = rawSummary.match(/WORLD:\s*([\s\S]+?)(?:\s*\|\s*LOCATION:|$)/);
        const locationMatch = rawSummary.match(/LOCATION:\s*([\s\S]+?)(?:\s*\|\s*ART_STYLE:|$)/);
        const artStyleMatch = rawSummary.match(/ART_STYLE:\s*([\s\S]+)/);
        const appearanceSummary = appearanceMatch?.[1]?.trim() ?? rawSummary;
        const worldAesthetic = worldMatch?.[1]?.trim() ?? '';
        const locationBackground = locationMatch?.[1]?.trim() ?? '';
        const artStyle = artStyleMatch?.[1]?.trim() || 'cinematic photorealistic portrait, dramatic lighting, sharp detail, shallow depth of field';

        const settingThemes = setting?.key_themes?.slice(0, 3).map((t: any) => t.theme ?? t).join(', ') ?? '';

        // Keep the genre label safe (avoid words that trigger moderation on their own)
        const safeGenre = ((setting?.genres?.length ? setting.genres.join(', ') : null) ?? 'fantasy').replace(/horror|gore|adult|explicit/gi, 'atmospheric');

        // Strip any remaining high-risk phrases that could leak through from backstory content
        const sanitise = (s: string) =>
            s.replace(/\b(blood|gore|kill|murder|death|dead|corpse|wound|scar|mutilat|undead|demon|stab|slash|weapon drawn|attack|violence|naked|nude|explicit)\w*/gi, '').trim();

        const promptParts = [
            `Cinematic portrait of a ${genderLabel} named ${name || 'a character'} (${race || 'Human'}) in a ${safeGenre} setting.`,
            appearanceSummary ? sanitise(appearanceSummary) : null,
            description ? `Character description (follow exactly — preserve all specific hair colour, eye colour, clothing and visual traits): ${sanitise(description)}` : null,
            locationBackground
                ? `Background setting: ${sanitise(locationBackground)}`
                : worldAesthetic
                ? `World visual context: ${sanitise(worldAesthetic)}`
                : settingThemes
                ? `The atmosphere and background should evoke: ${settingThemes}.`
                : null,
            worldAesthetic ? `Overall world aesthetic: ${sanitise(worldAesthetic)}` : null,
            `Art style: ${artStyle}.`,
            `Centered portrait composition, character in the foreground with the background location clearly visible behind them. Dramatic lighting, highly detailed face and costume.`,
            `No text, no words, no letters, no watermarks, no borders, no frames — pure artwork only.`,
        ].filter(Boolean);

        const prompt = promptParts.join(' ');

        const tryGenerate = async (p: string) => {
            const res = await openai.images.generate({
                model: 'gpt-image-1-mini',
                prompt: p,
                n: 1,
                size: '1024x1024',
                quality: 'medium' as any,
            });
            return res.data[0]?.b64_json ?? null;
        };

        let b64 = await tryGenerate(prompt).catch(() => null);

        if (!b64) {
            // Fallback 1: strip character-specific prose, keep genre + gender + art style
            const fallback1 = `A ${safeGenre} hero portrait of a ${genderLabel}. ${artStyle}. Centered composition. No text, no borders.`;
            b64 = await tryGenerate(fallback1).catch(() => null);
        }

        if (!b64) {
            // Fallback 2: completely generic — no genre, no race, just gender + safe style
            const fallback2 = `Portrait of a ${genderLabel} hero in a fantasy adventure world. Cinematic lighting, detailed costume, centered composition. No text, no borders.`;
            b64 = await tryGenerate(fallback2).catch(() => null);
        }

        if (!b64) return null;

        const imageBuffer = Buffer.from(b64, 'base64');
        const filename = `characters/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
        const blob = await put(filename, imageBuffer, {
            access: 'public',
            contentType: 'image/png',
        });

        return blob.url;
    } catch (err) {
        console.error('generatePortrait error:', err);
        return null;
    }
}
