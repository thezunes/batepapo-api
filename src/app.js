import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"
import dotenv from "dotenv"
import joi from "joi"

const app = express()
app.use(express.json())
app.use(cors())
dotenv.config()

let db
const mongoClient = new MongoClient("mongodb://0.0.0.0:27017/uol")
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
        if(names) return res.status(422).send("Usuário já cadastrado")

        const newParticipant = { name }

        try {
          await db.collection("participants").insertOne(newParticipant)
          res.status(201).send("Pariticipante adicionado")
        }
        catch{ 
          res.status(err).send(err)
        }
    })

const PORT = 5000
app.listen(PORT, ()=> console.log(`servidor rodando na porta ${PORT}`))