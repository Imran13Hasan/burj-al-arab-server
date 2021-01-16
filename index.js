const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

var serviceAccount = require("./configs/burj-al-arab-4097c-firebase-adminsdk-19a7a-a69ad7851a.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.DB_FIRE
});

const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2vxbu.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const collection = client.db("burjAlArab").collection("bookings");

    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        collection.insertOne(newBooking)
            .then(result => {
                res.send(result.insertedCount > 0);
                console.log(result)
            });
        console.log(newBooking)
    })

    app.get('/bookings', (req, res) => {
        // console.log(req.query.email)
        // console.log(req.headers.authorization)
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            console.log({ idToken })
            admin.auth().verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    if (tokenEmail == queryEmail) {
                        collection.find({ email: req.query.email })
                            .toArray((err, documents) => {
                                res.send(documents)
                            })
                    }else{
                        res.status(401).send("Un-authorized Access")
                    }
                })
                .catch((error) => {
                    res.status(401).send("Un-authorized Access")
                });
        }else{
            res.status(401).send("Un-authorized Access")
        }
    })



    console.log("MongoDB connected successfully")
});


app.get('/', (req, res) => {
    res.send('Hello BackEnd World!')
})

app.listen(`${process.env.DB_HOST}`)