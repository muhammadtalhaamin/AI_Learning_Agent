import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(audioBase64: string): Promise<string> {
  try {
    // Convert base64 to Buffer
    const audioBuffer = Buffer.from(audioBase64, 'base64');

    // Create a Blob from the buffer
    const blob = new Blob([audioBuffer], { type: 'audio/webm' });
    const file = new File([blob], 'audio.webm', { type: 'audio/webm' });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
    });

    return transcription.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}