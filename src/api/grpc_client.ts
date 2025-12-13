import { createClient } from 'nice-grpc-web';
import { createChannel } from 'nice-grpc-web';
import { SignalConversionClient } from '../generated/signal';
import { SignalConversionDefinition } from './service_definition';

const serverAddress = 'http://localhost:8080';

export const grpcClient: SignalConversionClient = createClient(
    SignalConversionDefinition,
    createChannel(serverAddress)
);
