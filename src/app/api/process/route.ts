import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { transcribeAudio } from '@/utils/whisper';

interface MediaChunk {
  mime_type: string;
  data: string;
}

interface RequestData {
  media_chunks: MediaChunk[];
}

export async function POST(req: NextRequest) {
  try {
    const data: RequestData = await req.json();
    const { media_chunks } = data;

    // Initialize Gemini with the new model
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const parts: Part[] = [];
    let transcribedText = '';

    // Process audio if present
    const audioChunk = media_chunks.find(chunk => chunk.mime_type === 'audio/webm');
    if (audioChunk) {
      try {
        transcribedText = await transcribeAudio(audioChunk.data);
        if (transcribedText) {
          parts.push({
            text: `User said: ${transcribedText}`
          } as Part);
        }
      } catch (error) {
        console.error('Audio transcription error:', error);
        // Continue execution even if audio transcription fails
      }
    }

    // Process image if present
    const imageChunk = media_chunks.find(chunk => chunk.mime_type === 'image/jpeg');
    if (imageChunk) {
      parts.push({
        inlineData: {
          data: imageChunk.data,
          mimeType: 'image/jpeg'
        }
      } as Part);
    }

    if (parts.length > 0) {
      try {
        // Add context and prompt
        const prompt = transcribedText
          ? `Please analyze the image and respond to what the user said: "${transcribedText}"`
          : 'Please analyze the image and describe what you see in detail.';

        parts.push({ text: prompt } as Part);

        const result = await model.generateContent(parts);
        const response = await result.response;

        return NextResponse.json({
          success: true,
          text: response.text(),
          transcription: transcribedText
        });
      } catch (error: any) {
        console.error('Gemini API error:', error);
        return NextResponse.json({
          success: false,
          error: error.message || 'Error generating content',
          details: error
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'No valid media chunks provided'
    }, { status: 400 });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      details: error
    }, { status: 500 });
  }
}