const express = require('express')
const cors = require('cors');
const multer = require('multer')
const path = require('path')
const fetch = require("node-fetch")
const https = require('https')
const fs = require('fs')
const parser = require('xml2json') // this line cause error, no need xml2json now because restaurants location is not precise
const app = express()
const port = 3001
const mysql = require('mysql')
// const config = require('./config.json') // have to tackle config
const db = mysql.createConnection({
  host: "aws-fyp.ckcjrbsei8vt.us-east-2.rds.amazonaws.com",
  user: "admin",
  password: "Hackerwillbeafraid!",
  database: 'fyp',
})

db.connect((err) => {
  if (err) {
    console.log(err)
  }
  else {
    console.log("Mysql connection success")
  }
})


// enable body from req
const bodyParser = require("body-parser");
const { errorMonitor } = require('events');
//json
const jsonParser = bodyParser.json()
//x-www-form-urlencoded
const urlencodedParsser = bodyParser.urlencoded({ extended: false })
// use middle ware
app.use(jsonParser)
app.use(urlencodedParsser)

app.use(cors());

const storageReg = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "../FYP/public/images/registration") // must put the FYP folder beside the FYP_backend (or it wont work)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

const storageMeals = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "../FYP/public/images/meals") // must put the FYP folder beside the FYP_backend (or it wont work)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

const storageRes = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "../FYP/public/images/restaurants") // must put the FYP folder beside the FYP_backend (or it wont work)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

const uploadRes = multer({
  storage: storageRes,
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
      return cb(new Error('Only images (jpg/png/jpeg) are allowed'))
    }
    cb(null, true)
  }
}).single('file')

const uploadReg = multer({
  storage: storageReg,
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
      return cb(new Error('Only images (jpg/png/jpeg) are allowed'))
    }
    cb(null, true)
  }
}).single('file')

const mealsUpload = multer({
  storage: storageMeals,
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
      return cb(new Error('Only images (jpg/png/jpeg) are allowed'))
    }
    cb(null, true)
  }
}).single('file')

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get("/expectedTime", async (req, res) => {
  let { origin, destination, key } = req.query
  origin = JSON.parse(origin)
  destination = JSON.parse(destination)
  const response = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?&origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&key=${key}`)
  const data = await response.json()
  return res.status(200).json(data)

})

app.post("/uploadReg", (req, res) => {
  uploadReg(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err)
    }
    else if (err) {
      return res.status(500).json(err)
    }
    console.log(req.file)
    return res.status(200).send(req.file)
  })
})

app.post("/uploadRes", (req, res) => {
  uploadRes(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err)
    }
    else if (err) {
      return res.status(500).json(err)
    }
    console.log(req.file)
    return res.status(200).send(req.file)
  })
})

app.post("/mealsUpload", (req, res) => {
  mealsUpload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err)
    }
    else if (err) {
      return res.status(500).json(err)
    }
    console.log(req.file)
    return res.status(200).send(req.file)
  })
})

app.post("/saveTimeSetting", (req, res) => {
  const {all, restaurantId} = req.body
  db.query("Update registration set open_hours = ? where id = ?",
    [all, restaurantId], (err, results) => {
      if (err) {
        console.log(err)
        res.status(500).send("Server error.")
        return
      }
      res.status(200).json(results)
    }
  )
})

app.post("/updateMeal", (req,res) => {
  const {id, name, type, price, avalibleTime, remarks, withSet, fileName} = req.body
  if (!fileName) {
    db.query("Update meals set name = ?, type = ?, price = ?, avalibleTime = ?, remarks = ?, withSet = ? where id = ?",
    [name, type, price, avalibleTime, remarks, withSet, id], (err, results) => {
    if (err) {
      console.log(err)
      res.status(500).send("Server error.")
      return
    }
    console.log(results)
    res.status(200).json(results)
    })
    return
  }
  db.query("Update meals set name = ?, type = ?, price = ?, avalibleTime = ?, remarks = ?, withSet = ?, photo = ? where id = ?",
    [name, type, price, avalibleTime, remarks, withSet, fileName, id], (err, results) => {
    if (err) {
      console.log(err)
      res.status(500).send("Server error.")
      return
    }
    console.log(results)
    res.status(200).json(results)
    })
})

app.post("/uploadRegistration", (req, res) => {
  const { firstValue, lastValue, phoneValue, idValue, restaurantValue, addressValue, brFileName, photoFilename, lat, lng, userId, OpenHours } = req.body
  console.log(req.body)
  db.query("Insert into registration (hkid, first_name, last_name, br_name, phone, restaurant, address, photo, lat, lng, open_hours) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [idValue, firstValue, lastValue, brFileName, phoneValue, restaurantValue, addressValue, photoFilename, lat, lng, OpenHours], (err, results) => {
      if (err) {
        console.log(err)
        return
      }
      db.query("Update users set owner = 1, restaurantId = ? where id = ?",
      [results.insertId, userId], (err, results2) => {
        if (err) {
          console.log(err)
          return
        }
      })
      console.log(results)
    }
  )
})

app.post("/insertMeal", (req, res) => {
  const {restaurantId, name, type, price, avalibleTime, remarks, withSet, fileName} = req.body
  db.query("Insert into meals (restaurantId, name, type, price, avalibleTime, remarks, withSet, photo, maxOrder) values (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [restaurantId, name, type, price, avalibleTime, remarks, withSet, fileName, 5], (err, results) => {
    if (err) {
      console.log(err)
      res.status(500).send("Server error.")
      return
    }
    console.log(results)
    res.status(200).json(results)
  })
})

app.post("/signup", (req, res) => {
  const { usernameValue, emailValue, password} = req.body
  console.log(req.body)
  db.query("Select id from users where username = ? or email = ?",
    [usernameValue, emailValue], (err, results) => {
      if (err) {
        console.log(err)
        res.status(500).send("Server error.")
        return
      }
      if (results.length !== 0) {
        res.status(401).send("username or email is already used.")
        return
      }
      db.query("Insert into users (username, email, password) values (?, ?, ?)",
        [usernameValue, emailValue, password], (err, results) => {
          if (err) {
            console.log(err)
            return
          }
          console.log(results.insertId)
          res.status(200).send({ id: results.insertId, owner: 0})
        }
      )
    }
  )
})

app.post("/signin", (req, res) => {
  const { username, password} = req.body
  console.log(req.body)
  db.query("Select id, owner, restaurantId from users where username = ? and password = ?",
    [username, password], (err, results) => {
      if (err) {
        console.log(err)
        res.status(500).send("Server error.")
        return
      }
      if (results.length === 0) {
        res.status(401).send("Cannot find relevant users")
        return
      }
      res.status(200).json(results)
    }
  )
})

app.post("/userOrder", (req, res) => {
  const {userId, orderId, restaurant, clientTakeaway, clientTotal} = req.body
  console.log(req.body)
  const date = new Date().toISOString().slice(0, 19).replace('T', ' ')
  db.query("Insert into user_orders (user_id, order_id, order_date, restaurant, type, total) values (?, ?, ?, ?, ?, ?)",
    [userId, orderId, date, restaurant, clientTakeaway ? 1 : 0, clientTotal], (err, results) => {
      if (err) {
        console.log(err)
        res.status(500).send("Server error.")
        return
      }
      res.status(200).json(results)
    }
  )
})

app.post("/sendOrder", (req, res) => { // early return before insert all values... (async problem)
  const { clientOrder, clientTotal, clientTakeaway, clientRestaurantId} = req.body
  console.log(req.body)
  db.query("Select max(order_id) as maxId from order_items", (err, results) => {
      if (err) {
        console.log(err)
        res.status(500).send("Server error.")
        return
      }
      const newId = results[0].maxId ? results[0].maxId + 1 : 1
      clientOrder.forEach(({name, drink, price, special}) => {
        db.query("Insert into order_items (order_id, name, drink, price, special, total, takeaway, done, restaurantId) values (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [newId, name, drink, price, special, clientTotal, clientTakeaway ? 1 : 0, 0, clientRestaurantId], (err, results) => {
            if (err) {
              console.log(err)
              return
            }
            console.log(results)
          }
        )
      })
      res.status(200).json(newId)
    }
  )
})

app.post("/checkRecaptcha", (req, res) => {
  const { secret, response } = req.body
  fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${response}`)
    .then(response => response.json())
    .then(data => {
      res.send(data.success)
    })
})

app.get("/getdata", (req, res) => {
  db.query("Select * from meals where restaurantId = ?",
    [req.query.id], (err, results) => {
      if (err) {
        console.log(err)
        res.status(500).send("Server error.")
        return
      }
      if (results.length === 0) {
        res.status(400).send("data not found")
        return
      }
      res.status(200).json(results)
    }
  )
})

app.get("/getUserOrders", (req, res) => {
  db.query("Select * from user_orders where user_id = ?",
    [req.query.id], (err, results) => {
      if (err) {
        console.log(err)
        res.status(500).send("Server error.")
        return
      }
      if (results.length === 0) {
        res.status(400).send("data not found")
        return
      }
      res.status(200).json(results)
    }
  )
})

app.get("/getRegData", (req, res) => {
  db.query("Select * from registration where id = ?",
    [req.query.id], (err, results) => {
      if (err) {
        console.log(err)
        res.status(500).send("Server error.")
        return
      }
      if (results.length === 0) {
        res.status(400).send("data not found")
        return
      }
      res.status(200).json(results)
    }
  )
})

app.get("/getOrders", (req, res) => {
  db.query("Select * from order_items where restaurantId = ? and done = 0",
    [req.query.id], (err, results) => {
      if (err) {
        console.log(err)
        res.status(500).send("Server error.")
        return
      }
      res.status(200).json(results)
    }
  )
})

app.get("/getTimeSetting", (req, res) => {
  db.query("Select open_hours from registration where id = ?",
    [req.query.id], (err, results) => {
      if (err) {
        console.log(err)
        res.status(500).send("Server error.")
        return
      }
      res.status(200).json(results)
    }
  )
})

app.get("/getRestaurants", (req, res) => {
  const searchTag = req.query.searchTag || ".*"
  db.query("Select * from registration where restaurant REGEXP ? ",
    [searchTag], (err, results) => {
      if (err) {
        console.log(err)
        res.status(500).send("Server error.")
        return
      }
      res.status(200).json(results)
    }
  )
})

app.get("/deleteMeal", (req, res) => {
  db.query("delete from meals where id = ?",
    [req.query.id], (err, results) => {
      if (err) {
        console.log(err)
        res.status(500).send("Server error.")
        return
      }
      if (results.length === 0) {
        res.status(401).send("data not found")
        return
      }
      res.status(200).json(results)
    }
  )
})

app.get("/loadLocationXML", (req, res) => {
  const file = fs.createWriteStream("./location.xml");
  //chinese version: https://www.fehd.gov.hk/tc_chi/licensing/license/text/LP_Restaurants_TC.XML
  //english version: https://www.fehd.gov.hk/english/licensing/license/text/LP_Restaurants_EN.XML
  const request = https.get("https://www.fehd.gov.hk/tc_chi/licensing/license/text/LP_Restaurants_TC.XML", function (response) {
    response.pipe(file);
  });
})

app.get("/xmlToJson", (req, res) => {
  fs.readFile('./location.xml', async (err, data) => {
    if (Object.keys(data).length === 0) { // latency in loadLocationXML problem
      console.log("error")
      return
    }
    const jsonString = parser.toJson(data)
    const jsonObj = JSON.parse(jsonString)
    const restaurantInfo = jsonObj.DATA.LPS.LP
    //due to pricing in google api, limit the usage 1st
    const limitresInfo = restaurantInfo.slice(0, 100)
    // geocoding
    const restaurantLoc = []
    for (const res of limitresInfo) { // using async in array.map is incompatible, perhaps array.map is synchronous function
      const { SS, ADR } = res
      const url = new URL(`https://maps.googleapis.com/maps/api/geocode/json?address=${ADR}&key=${config.key}`)
      const response = await fetch(url)
      const resData = await response.json()
      const { lat, lng } = resData.results[0].geometry.location
      restaurantLoc.push({ SS, ADR, lat, lng })
    }
    const saveObj = { restaurantLoc }
    const saveJson = JSON.stringify(saveObj);
    fs.writeFile('./restaurantLoc.json', saveJson, 'utf8', () => { console.log("json file saved") });
  })
})



app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})