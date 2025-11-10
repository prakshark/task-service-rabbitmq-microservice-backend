import amqp from "amqplib";

async function start() {
    try {
        connection = await amqp.connect("amqp://rabbitmq");
        channel = await connection.createChannel();

        await channel.assertQueue("task_created"); // to check if queue is present
        console.log("Notification service is listening to messages");

        channel.consume("task_created", (msg) => {
            const taskData = JSON.parse(msg.content.toString());
            console.log(`Notification: NEW TASK: ${taskData}`);
            channel.ack(msg);
        })
    } catch (error) {
        
    }
}

start();