import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { GeneratedImage } from '@/types';

const IMAGES_DIR = path.join(process.cwd(), 'public', 'generated-images');
const METADATA_FILE = path.join(IMAGES_DIR, 'metadata.json');

// Read metadata
async function readMetadata(): Promise<GeneratedImage[]> {
  try {
    if (!existsSync(METADATA_FILE)) {
      return [];
    }
    const data = await readFile(METADATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading metadata:', error);
    return [];
  }
}

// Write metadata
async function writeMetadata(images: GeneratedImage[]): Promise<void> {
  await writeFile(METADATA_FILE, JSON.stringify(images, null, 2), 'utf-8');
}

// DELETE: Delete a specific image
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Delete image file
    const filepath = path.join(IMAGES_DIR, `${id}.png`);
    if (existsSync(filepath)) {
      await unlink(filepath);
    }

    // Update metadata
    const images = await readMetadata();
    const filtered = images.filter(img => img.id !== id);
    await writeMetadata(filtered);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
