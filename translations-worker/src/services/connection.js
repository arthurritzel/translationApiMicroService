import amqp from 'amqplib';
import colors from 'colors';

export default async (queue, exchange, routingKey, callback) => {
    const RABBIT_MQ = process.env.RABBIT_MQ;
    const MAX_RETRIES = parseInt(process.env.MAX_RETRIES) || 3;
    
    try {
        const connection = await amqp.connect(RABBIT_MQ);
        const channel = await connection.createChannel();

        process.once("SIGINT", async () => {
            console.log("Closing translation consumer connection...");
            await channel.close();
            await connection.close();
        });

        await channel.assertQueue(queue, { durable: true });
        await channel.assertQueue(`${queue}_dlq`, { durable: true });

        await channel.bindQueue(
            queue,
            exchange,
            routingKey
        );

        await channel.bindQueue(
            `${queue}_dlq`,
            exchange,
            "dlq"
        );

        console.log(colors.cyan(`🔄 Translation consumer started. Waiting for messages in queue: ${queue}`));

        await channel.consume(
            queue, 
            async (message) => {
                const content = message.content.toString();
                const retries = message.properties.headers['x-retries'] || 0;
                
                try {
                    console.log(colors.green('==> Translation request received'), content);
                    console.log(colors.green('==> Retry count'), retries);

                    const translationData = JSON.parse(content);
                    console.log(translationData)
                    // Chamar a função de callback para processar a tradução
                    await callback(translationData);
                    
                    console.log(colors.green(`==> Translation processed successfully for requestId: ${translationData?.correlationId}`));
                    
                } catch (error) {
                    console.error(colors.red(`==> Error processing translation: ${error.message}`));
                    
                    if (retries < MAX_RETRIES) {
                        console.log(colors.yellow('==> Retrying translation request'));
                        channel.sendToQueue(
                            queue,
                            Buffer.from(content),
                            {
                                headers: {
                                    'x-retries': retries + 1,
                                },
                                persistent: true,
                            }
                        );
                    } else {
                        console.log(colors.red("==> Sending translation request to DLQ (Dead Letter Queue)"));
                        channel.publish(
                            exchange,
                            "dlq",
                            Buffer.from(content),
                            {
                                headers: {
                                    'x-retries': retries,
                                    'error-message': error.message,
                                    'failed-at': new Date().toISOString()
                                },
                                persistent: true,
                            }
                        );
                    }
                } finally {
                    channel.ack(message);
                }
            }, 
            { noAck: false }
        );
        
    } catch (error) {
        console.error(colors.red('Error in translation consumer connection:', error));
        throw error;
    }
}