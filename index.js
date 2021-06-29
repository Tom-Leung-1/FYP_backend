const express = require('express')
const cors = require('cors');
const multer = require('multer')
const path = require('path')
const fetch = require("node-fetch")
const app = express()
const port = 3001

// enable body from req
const bodyParser = require("body-parser")
//json
const jsonParser = bodyParser.json()
//x-www-form-urlencoded
const urlencodedParsser = bodyParser.urlencoded({extended: false})
// use middle ware
app.use(jsonParser)
app.use(urlencodedParsser)

app.use(cors());


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "upload")
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname)
  }
})

const upload = multer({
   storage: storage,
   fileFilter: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      if(ext !== '.png' && ext !== '.jpg'  && ext !== '.jpeg') {
        return cb(new Error('Only images (jpg/png/jpeg) are allowed'))
      }
      cb(null, true)
   } 
  }).single('file')

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

app.post("/checkRecaptcha", (req, res)=> {
  const {secret, response} = req.body
  fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${response}`)
  .then(response => response.json())
  .then(data => {
    res.send(data.success)
  })
})


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})