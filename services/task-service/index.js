import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import amqp from "amqplib";

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Task Schema:

const taskSchema = new mongoose.Schema({
    title: String,
    description: String,
    userId: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Task = mongoose.model('Task', taskSchema);

// RabbitMQ connection logic to call while starting the server:
let channel, connection;
async function connectRabbitMQWithRetry(retries = 5, delay = 3000) {
    while(retries) {
        try {
            connection = await amqp.connect("amqp://rabbitmq");
            channel = await connection.createChannel();
            await channel.assertQueue("task_created");
            console.log("Connected to rabbitMQ");
            return;
        } catch (error) {
            console.log(`RabbitMQ connection error: ${error.message}`);
            retries--;
            await new Promise(res => setTimeout(res, delay)); // retry after delay
        }
    }
}

// Routes and controllers:

app.post("/tasks", async (req, res) => {
    const {title, description, userId} = req.body;
    try {
        const task = new Task({
            title: title,
            description: description,
            userId: userId
        })
        await task.save();

        // Send to rabbitMQ message queue:
        const message = {
            taskId: task._id,
            userId,
            title
        }
        if(!channel) {
            return res.status(500).json({
                error: "RabbitMQ not connected"
            })
        }
        channel.sendToQueue("task_created", Buffer.from(
            JSON.stringify(message)
        ));

        res.status(201).json(task);
    } catch (error) {
        console.log('Error in creating task');
        res.status(500).json(error);
    }
})

app.get("/tasks", async (req, res) => {
    try {
        const allTasks = await Task.find({});
        return res.status(200).json(allTasks);
    } catch (error) {
        return res.status(500).json(error);
    }
})

async function startTaskServer() {
    try {
        const PORT = 4002;
        try {
            await mongoose.connect('mongodb://mongo:27017/tasks');
            console.log('Connected to mongo database tasks');
            connectRabbitMQWithRetry();
            console.log(`Connected to rabbitMQ`);
        } catch (error) {
            console.log(error);
        }

        app.listen(PORT, () => {
            console.log('Connected to tasks server');
        })
    } catch (error) {
        console.log('Error connecting to the tasks server');
    }
}

startTaskServer();