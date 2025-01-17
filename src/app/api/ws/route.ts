import { NextResponse } from 'next/server';
import { WebSocketServer } from 'ws';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';

interface MediaChunk {
  mime_type: string;
  data: string;
}

interface RealtimeInput {
  media_chunks: MediaChunk[];
}

interface WebSocketMessage {
  realtime_input?: RealtimeInput;
  setup?: {
    generation_config: {
      response_modalities: string[];
    };
  };
}

const MODEL = "gemini-pro-vision";  // Changed to use gemini-pro-vision for multimodal
const TRANSCRIPTION_MODEL = "gemini-pro";  // Changed to use gemini-pro for text

let wss: WebSocketServer;

export async function GET() {
  if (!wss) {
    wss = new WebSocketServer({ port: 9083 });

    wss.on('connection', async (ws) => {
      console.log('Client connected');

      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
      const model = genAI.getGenerativeModel({ model: MODEL });
      const transcriptionModel = genAI.getGenerativeModel({ model: TRANSCRIPTION_MODEL });

      let chat = model.startChat({
        history: [],
        generationConfig: {
          maxOutputTokens: 2048,
        },
      });

      ws.on('message', async (message: string) => {
        try {
          console.log('Received message:', message);
          const data: WebSocketMessage = JSON.parse(message);

          if (data.setup) {
            console.log('Received setup message:', data.setup);
            return;
          }

          if (data.realtime_input) {
            const { media_chunks } = data.realtime_input;
            let transcribedText = '';
            let imageData = '';
            
            // Process each media chunk
            for (const chunk of media_chunks) {
              if (chunk.mime_type === 'audio/pcm') {
                try {
                  // Use Google's Speech-to-Text API or another service here
                  // For now, we'll just acknowledge receiving audio
                  console.log('Received audio chunk');
                  transcribedText = 'Audio received'; // Replace with actual transcription
                } catch (error) {
                  console.error('Error processing audio:', error);
                }
              } else if (chunk.mime_type === 'image/jpeg') {
                imageData = chunk.data;
              }
            }

            try {
              // Prepare parts for Gemini
              const parts: Part[] = [];
              
              // Add transcribed text if available
              if (transcribedText) {
                parts.push({ text: transcribedText });
              }

              // Add image if available
              if (imageData) {
                parts.push({
                  inlineData: {
                    data: imageData,
                    mimeType: 'image/jpeg'
                  }
                });
              }

              // Add analysis prompt
              parts.push({ text: 'Please analyze what you see in the image and respond to any audio input.' });

              console.log('Sending to Gemini:', parts);

              // Generate response using Gemini
              const result = await model.generateContent(parts);
              const response = await result.response;
              const text = response.text();

              console.log('Gemini response:', text);

              // Send response back to client
              ws.send(JSON.stringify({ 
                text,
                type: 'response'
              }));

            } catch (error) {
              console.error('Error generating content:', error);
              ws.send(JSON.stringify({ 
                text: 'Error generating response. Please try again.',
                type: 'error'
              }));
            }
          }
        } catch (error) {
          console.error('Error processing message:', error);
          ws.send(JSON.stringify({ 
            text: 'Error processing your request. Please try again.',
            type: 'error'
          }));
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected');
      });
    });
  }

  return new NextResponse('WebSocket server is running', { status: 200 });
}