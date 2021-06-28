const express = require('express')
const cors = require('cors');
const multer = require('multer')
const app = express()
const port = 3001

app.use(cors());


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "upload")
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname)
  }
})

const upload = multer({ storage: storage }).single('file')

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post("/upload", (req, res)=> {
  upload(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err)
    }
    else if (err) {
      return res.status(500).json(err)
    }
    return res.status(200).send(req.file)
  })
})
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})