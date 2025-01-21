import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { transcribeAudio } from '@/utils/whisper';

interface MediaChunk {
  mime_type: string;
  data: string;
}

interface RequestData {
  media_chunks: MediaChunk[];
  conversationHistory: ConversationMessage[];
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const data: RequestData = await req.json();
    const { media_chunks, conversationHistory = [] } = data;

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const parts: Part[] = [];
    let transcribedText = '';

    // Process audio if present
    const audioChunk = media_chunks.find(chunk => chunk.mime_type === 'audio/webm');
    if (audioChunk) {
      try {
        transcribedText = await transcribeAudio(audioChunk.data);
      } catch (error) {
        console.error('Audio transcription error:', error);
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

    if (parts.length > 0 || transcribedText) {
      try {
        // System prompt with conversation guidelines
        const systemPrompt = `You are a helpful math tutor who can see what's on the user's screen. 
        Your key characteristics:
        1. You maintain context from previous messages in the conversation.
        2. You help solve problems step by step, automatically proceeding to the next step after user confirmation.
        3. You ask clarifying questions only when necessary.
        4. You acknowledge user's questions directly and build upon previous context.
        5. You keep responses focused and avoid unnecessary descriptions.
        6. You guide users through problem-solving by taking initiative and solving the problem step by step.

        Current conversation context:
        ${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

        Remember to:
        - Automatically proceed to the next step after user confirmation.
        - Display the output properly formated and avoid showing '** **' around steps.
        - Solve the problem step by step without asking for unnecessary confirmations.
        - Keep the conversation natural and engaging.
        - Focus on the current step without jumping ahead.
        - Always acknowledge the user's input and build upon it.`;

        parts.unshift({ text: systemPrompt } as Part);
        if (transcribedText) {
          parts.push({ text: transcribedText } as Part);
        }

        const result = await model.generateContent(parts);
        const response = await result.response;
        const responseText = response.text();

        // Generate speech response
        const speechResponse = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'tts-1',
            voice: 'alloy',
            input: responseText
          })
        });

        if (!speechResponse.ok) {
          throw new Error('Speech generation failed');
        }

        const audioBuffer = await speechResponse.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString('base64');

        return NextResponse.json({
          success: true,
          text: responseText,
          transcription: transcribedText,
          audioResponse: base64Audio
        });
      } catch (error: any) {
        console.error('Generation error:', error);
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'No valid input provided'
    }, { status: 400 });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}