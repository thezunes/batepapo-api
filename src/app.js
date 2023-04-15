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
          console.log("Todos os campos deverão ser obrigatórios")
          res.status(422).send(error)
          return;
        }

        const names = await db.collection("participants").findOne({name: name})
        if(names) return res.status(409).send("Usuário já cadastrado")

        const newParticipant = { name, lastStatus: Date.now() }

        const time = dayjs().format('HH:mm:ss');
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
          await db.collection("message").insertOne(userInfo)
        
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

    


const PORT = 5000
app.listen(PORT, ()=> console.log(`servidor rodando na porta ${PORT}`))