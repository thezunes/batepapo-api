import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"
import dotenv from "dotenv"
import joi from "joi"
import dayjs from "dayjs"

dotenv.config()
const app = express()
app.use(express.json())
app.use(cors())
dotenv.config()

const time = dayjs().format('HH:mm:ss');


let db
const mongoClient = new MongoClient(process.env.DATABASE_URL)
mongoClient.connect()
    .then(() => db = mongoClient.db())
    .catch((err) => console.log(err.message))

    app.post("/participants", async (req, res) => {
        const { name } = req.body

        const userSchema = joi.object({
          name: joi.string().required()
        });
        const user = {name: name}
        const validation = userSchema.validate(user);
        
        if (validation.error) {
          const error = validation.error.details
          res.status(422).send("Todos os campos são obrigatórios")
          return;
        }

        const names = await db.collection("participants").findOne({name: name})
        if(names) return res.status(409).send("Usuário já cadastrado")

        const newParticipant = { name, lastStatus: Date.now() }

        const userInfo = { 
          from: name,
          to: 'Todos',
          text: 'entra na sala...',
          type: 'status',
          time: time
      }

        try {
          
          await db.collection("participants").insertOne(newParticipant)
          res.status(201).send("Pariticipante adicionado")
          await db.collection("messages").insertOne(userInfo)
        
        }
        catch{ 
          res.status(404)
        }
    })

    app.get("/participants", async (req, res) => {

    await db.collection("participants").find().toArray() 
    .then((participants) => (participants ? res.status(200).send(participants) : res.status(200).send({})))
    .catch((err) => res.status(500).send(err.message))
    })

    app.get ("/messages", async (req, res) => {

      await db.collection("messages").find().toArray()
      .then((messages) => res.status(200).send(messages))
      .catch((err) => res.status(500).send(err.message))

    })
    
    app.post ("/messages", async (req, res) => {

    const { to , text, type } = req.body
    const user = req.headers.user
    const fullMessage = {from: user, to: to, text: text, type: type, time: time }
    const message = { to: to, text: text, type: type }
    const participantOnline = await db.collection("participants").findOne({name: user})

    if(!participantOnline) return res.status(422).send("Você precisa estar online para enviar mensagem");
    if(!user) return res.status(422).send("user não recebido pelo header");

    

    const userSchema = joi.object({
      to: joi.string().required(),
      text: joi.string().required(),
      type: joi.string().valid("message", "private_message").required(),
     });

    const validation = userSchema.validate(message, { abortEarly: false });
    
    if (validation.error) {
      const errors = validation.error.details.map((detail) => detail.message);
      return res.status(422).send(errors);
    }
    
    try{

    await db.collection("messages").insertOne(fullMessage)
    res.sendStatus(201)
    }

    catch{

    res.sendStatus(404)
    }

    })

const PORT = 5000
app.listen(PORT, ()=> console.log(`servidor rodando na porta ${PORT}`))