import amqp from 'amqplib';
import { v4 } from 'uuid';

const exchange = 'translationExchange';
const routingKey = 'translationQueue';

export default async () => {
    let connection;
    try {
        connection = await amqp.connect(process.env.RABBIT_MQ);
        const channel = await connection.createChannel();

        await channel.assertExchange(exchange, 'direct', { durable: true });

        await channel.close();
        
        return {
            success: true,
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