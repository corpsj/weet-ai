import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { GeneratedImage } from '@/types';

const IMAGES_DIR = path.join(process.cwd(), 'public', 'generated-images');
const METADATA_FILE = path.join(IMAGES_DIR, 'metadata.json');

// Ensure directory exists
async function ensureDirectory() {
  if (!existsSync(IMAGES_DIR)) {
    await mkdir(IMAGES_DIR, { recursive: true });
  }
}

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
  await ensureDirectory();
  await writeFile(METADATA_FILE, JSON.stringify(images, null, 2), 'utf-8');
}

// GET: Load all images
export async function GET(request: NextRequest) {
  try {
    const images = await readMetadata();
    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error loading images:', error);
    return NextResponse.json(
      { error: 'Failed to load images' },
      { status: 500 }
    );
  }
}

// POST: Save new images
export async function POST(request: NextRequest) {
  try {
    const { images: newImages } = await request.json();

    if (!Array.isArray(newImages) || newImages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid images data' },
        { status: 400 }
      );
    }

    await ensureDirectory();

    // Save each image file
    for (const image of newImages) {
      const filename = `${image.id}.png`;
      const filepath = path.join(IMAGES_DIR, filename);

      // Convert base64 to buffer and save
      const buffer = Buffer.from(image.base64Data, 'base64');
      await writeFile(filepath, buffer);

      // Remove base64Data from metadata (we'll load it from file when needed)
      delete image.base64Data;
    }

    // Update metadata
    const existingImages = await readMetadata();
    const updatedImages = [...newImages, ...existingImages];
    await writeMetadata(updatedImages);

    return NextResponse.json({
      success: true,
      count: newImages.length
    });
  } catch (error) {
    console.error('Error saving images:', error);
    return NextResponse.json(
      { error: 'Failed to save images' },
      { status: 500 }
    );
  }
}

// DELETE: Clear all images
export async function DELETE(request: NextRequest) {
  try {
    await writeMetadata([]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing images:', error);
    return NextResponse.json(
      { error: 'Failed to clear images' },
      { status: 500 }
    );
  }
}
