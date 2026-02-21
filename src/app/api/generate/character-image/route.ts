import { NextResponse } from 'next/server';
import { generatePortrait } from '@/utils/generatePortrait';

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const { name, race, description, backstory, setting } = await request.json();
        const imageUrl = await generatePortrait({ name, race, description, backstory, setting });
        if (!imageUrl) {
            return NextResponse.json({ error: 'Image generation was rejected or failed. Please try again.' });
        }
        return NextResponse.json({ imageUrl });
    } catch (error: any) {
        console.error('Error generating character image:', error);
        return NextResponse.json({ error: error?.message ?? 'Failed to generate image' });
    }
}

