import dotent from 'dotenv'
import express, { Express, Request, Response } from 'express'

dotent.config()

const app: Express = express()
const port = process.env.PORT || 5001

app.use(express.json())

app.get("/", (req: Request, res: Response) => {
  const { message } = req.body

  if (!message) return res.status(400).send({ error: "message: is required" })

  res.send({ message })
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port} UFAA`)
})
