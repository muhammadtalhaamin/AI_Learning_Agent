// src/server/websocket.ts
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { transcribeAudio } from '@/utils/whisper';

interface MediaChunk {
  mime_type: string;
  data: string;
}

interface RealtimeInput {
  media_chunks: MediaChunk[];
}

interface SetupConfig {
  generation_config: {
    response_modalities: string[];
  };
}

interface WebSocketMessage {
  setup?: SetupConfig;
  realtime_input?: RealtimeInput;
}

export class WebSocketHandler {
  private wss: WebSocketServer | null = null;
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  }

  public initialize(port: number = 9083) {
    if (!this.wss) {
      this.wss = new WebSocketServer({ port });
      
      this.wss.on('listening', () => {
        console.log(`WebSocket server is listening on port ${port}`);
      });

      this.wss.on('connection', this.handleConnection.bind(this));
    }
    return this.wss;
  }

  private async handleConnection(ws: WebSocket) {
    console.log('Client connected to WebSocket');
    
    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    
    let chat = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 2048,
      },
    });

    ws.on('message', async (message: Buffer) => {
      try {
        const data: WebSocketMessage = JSON.parse(message.toString());
        console.log('Received message:', data);

        if (data.setup) {
          console.log('Setup received:', data.setup);
          return;
        }

        if (data.realtime_input?.media_chunks) {
          const { media_chunks } = data.realtime_input;
          
          const parts: Part[] = [];
          let transcribedText = '';

          // Process audio if present
          const audioChunk = media_chunks.find((chunk: MediaChunk) => 
            chunk.mime_type === 'audio/pcm'
          );
          
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
            }
          }

          // Process image if present
          const imageChunk = media_chunks.find((chunk: MediaChunk) => 
            chunk.mime_type === 'image/jpeg'
          );
          
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
              parts.push({ 
                text: `Please analyze the image and/or respond to: "${transcribedText}"`
              } as Part);

              const result = await model.generateContent(parts);
              const response = await result.response;
              ws.send(JSON.stringify({
                type: 'response',
                text: response.text()
              }));
            } catch (error) {
              console.error('Gemini API error:', error);
              ws.send(JSON.stringify({
                type: 'error',
                text: 'Error generating response'
              }));
            }
          }
        }
      } catch (error) {
        console.error('Message processing error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          text: 'Error processing message'
        }));
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  }

  public close() {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }
}

export const wsHandler = new WebSocketHandler();