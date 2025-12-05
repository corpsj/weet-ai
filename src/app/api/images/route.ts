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
    const formData = await request.formData();
    const metadataStr = formData.get('metadata') as string;
    const files = formData.getAll('files') as File[];

    if (!metadataStr || !files || files.length === 0) {
      return NextResponse.json(
        { error: 'Invalid images data' },
        { status: 400 }
      );
    }

    const newImagesMetadata: GeneratedImage[] = JSON.parse(metadataStr);

    if (newImagesMetadata.length !== files.length) {
      return NextResponse.json(
        { error: 'Mismatch between metadata and files' },
        { status: 400 }
      );
    }

    await ensureDirectory();

    // Save each image file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const metadata = newImagesMetadata[i];

      // Use ID from metadata for filename
      const filename = `${metadata.id}.png`;
      const filepath = path.join(IMAGES_DIR, filename);

      // Convert File to Buffer and save
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await writeFile(filepath, buffer);

      // Ensure base64Data is removed from metadata just in case
      delete (metadata as any).base64Data;
    }

    // Update metadata
    const existingImages = await readMetadata();
    const updatedImages = [...newImagesMetadata, ...existingImages];
    await writeMetadata(updatedImages);

    return NextResponse.json({
      success: true,
      count: newImagesMetadata.length
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error saving images:', errorMessage, error);
    return NextResponse.json(
      { error: `Failed to save images: ${errorMessage}` },
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
