import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

// User Schema:
const userSchema = new mongoose.Schema({
    name: {
        type: String
    },
    email: {
        type: String
    }
});
const User = mongoose.model('User', userSchema); 

// Routes and controllers:
app.get('/users', async(req, res) => {
    try {
        const allUsers = await User.find({});
        return res.status(200).json({
            users: allUsers
        });
    } catch (error) {
        res.status(500).json(error);
    }
})

app.post('/users', async(req, res) => {
    const {name, email} = req.body;
    try {
        const user = new User({
            name: name,
            email: email
        })
        await user.save();
        res.status(201).json({
            message: "User created",
            User: user
        })
    } catch (error) {
        console.log(`Error in creating user: ${error}`);
        res.status(500).json({
            message: "Error in creating new user",
            error: error
        })
    }
})

// User server start function
const startUserServer = async() => {
    try {
        await mongoose.connect('mongodb://mongo:27017/users')
            .then(() => {
                console.log(`Connected to mongodb users database`);
            }).catch((err) => {
                console.log(`MongoDB connection error for users db: ${err}`);
            })

        const PORT = 4001;
        app.listen(PORT, () => {
            console.log(`User service server is running at port ${PORT}`)
        });
    } catch (error) {
        console.log(`Error starting the users DB: ${error}`);
    }
}

startUserServer();