// 4. src/lib/websocket-client.ts
export class WebSocketClient {
    private ws: WebSocket | null = null;
    private messageHandlers: ((data: any) => void)[] = [];
  
    constructor(private url: string) {}
  
    connect() {
      this.ws = new WebSocket(this.url);
  
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.sendSetupMessage();
      };
  
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.messageHandlers.forEach(handler => handler(data));
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };
  
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
  
      this.ws.onclose = () => {
        console.log('WebSocket closed');
      };
    }
  
    private sendSetupMessage() {
      this.send({
        setup: {
          generation_config: {
            response_modalities: ['AUDIO']
          }
        }
      });
    }
  
    send(data: any) {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(data));
      }
    }
  
    onMessage(handler: (data: any) => void) {
      this.messageHandlers.push(handler);
    }
  
    close() {
      this.ws?.close();
    }
  }
  