import amqp from 'amqplib';
import { v4 } from 'uuid';

const exchange = 'translationExchange';
const routingKey = 'translationQueue';

export default async (translationData) => {
    let connection;
    try {
        connection = await amqp.connect(process.env.RABBIT_MQ);
        const channel = await connection.createChannel();

        await channel.assertExchange(exchange, 'direct', { durable: true });

        const message = {
            eventType: 'translation_request',
            version: "1.0",
            producer: "translation-api",
            timestamp: new Date(),
            correlationId: translationData.requestId,
            retryCount: 0,
            maxRetries: translationData.maxRetries || 3,
            data: {
                text: translationData.text,
                sourceLang: translationData.sourceLang,
                targetLang: translationData.targetLang,
            }
        };

        const messageOptions = {
            persistent: true,
            priority: 5,
            messageId: translationData.requestId,
            timestamp: Date.now(),
            headers: {
                'source-lang': translationData.sourceLang,
                'target-lang': translationData.targetLang,
                'request-id': translationData.requestId
            }
        };

        const success = channel.publish(
            exchange, 
            routingKey, 
            Buffer.from(JSON.stringify(message)),
            messageOptions
        );

        if (!success) {
            throw new Error('Failed to publish translation to queue');
        }

        console.log(`Translation request published: ${translationData.requestId} (${translationData.sourceLang} -> ${translationData.targetLang})`);
        
        await channel.close();
        
        return {
            success: true,
            requestId: translationData.requestId
        };

    } catch (error) {
        console.error(`Error publishing translation request: ${error.message}`);
        throw new Error(`Error publishing translation request: ${error.message}`);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
};