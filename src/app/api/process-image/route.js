import { NextResponse } from 'next/server';

// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 10; // Maximum duration in seconds

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');
    
    if (!file) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Uploaded file is not an image' },
        { status: 400 }
      );
    }

    // In a real implementation, you would process the image here
    // Since the frontend already processes images with Tesseract.js on the client side,
    // this endpoint is just a placeholder for future server-side image processing

    return NextResponse.json({ 
      success: true,
      message: 'Image received successfully'
    });

  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process image' },
      { status: 500 }
    );
  }
} 


