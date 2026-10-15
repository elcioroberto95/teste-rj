export interface ConfirmPublisher {
  publish(exchange: string, routingKey: string, content: Buffer, options: object): boolean;
  waitForConfirms(): Promise<void>;
}
