import ampq from "amqplib";
let channel;
export const connectRabbitMQ = async () => {
    try {
        const connection = await ampq.connect({
            protocol: "amqp",
            hostname: process.env.Rabbitmq_Host,
            port: 5672,
            username: process.env.Rabbitmq_Username,
            password: process.env.Rabbitmq_Password,
        });
        channel = await connection.createChannel();
        console.log("✅ Connected to rabbitmq");
    }
    catch (error) {
        console.error("Failed to connect to rabbitmq", error);
    }
};
export const publishToQueue = async (queueName, message) => {
    if (!channel) {
        console.log("Rabbitmq channel is not initialized");
        return;
    }
    await channel.assertQueue(queueName, { durable: true });
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
        persistent: true
    });
};
//# sourceMappingURL=rabbitmq.js.map