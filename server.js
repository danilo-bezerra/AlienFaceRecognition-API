const express = require('express');
const bcrypt = require('bcrypt-nodejs')
const cors = require('cors')
const knex = require('knex')
const {ClarifaiStub, grpc} = require("clarifai-nodejs-grpc");

const stub = ClarifaiStub.grpc();
const metadata = new grpc.Metadata();
metadata.set("authorization", "Key API_KEY");

const app = express()
const db = knex({
    client: 'pg',
    connection: {
      host : 'DATABAASE ADDRESS',
      port : 5432,
      user : 'DATABASE USERNAME',
      password : 'DATABASE PASSWORD',
      database : 'DATABSE NAME'
    }
})

app.use(express.json())
app.use(cors())

function useClarifai(imageUrl) {
    stub.PostModelOutputs(
        {
            model_id: "face-detection",
            inputs: [{data: {image: {url: imageUrl}}}]
        },
        metadata,
        (err, response) => {
            if (err) {
                console.log("Error: " + err);
                return;
            }
    
            if (response.status.code !== 10000) {
                console.log("Received failed status: " + response.status.description + "\n" + response.status.details);
                return;
            }
    
            console.log("Predicted concepts, with confidence values:")
            // console.log(response.outputs[0].data.regions[0].region_info.bounding_box)
            return response.outputs[0].data.regions[0].region_info.bounding_box
        }
    );
}
 
app.get('/', (req, res) => {
    
})

app.post('/signin', (req, res) => {
    const {email, password} = req.body
    db.select('email', 'hash').from('login')
        .where('email', '=', email)
        .then(data => {
            const valid = bcrypt.compareSync(password, data[0].hash);
            if (valid) {
                return db.select('*').from('users')
                    .where('email', '=', email)
                    .then(user => {
                        console.log(user[0])
                        res.json(user[0])
                    })
            } else {
                res.status(400).json('wrong credentials 1')
            }
        }).catch(() => {
            res.status(400).json('wrong credentials 2')
        })
})

app.post('/register', (req, res) => {
    const {email, password, name} = req.body
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    db.transaction(trx => {
        trx.insert({
            email: email,
            hash: hash
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
            console.log(loginEmail[0].email)
            return trx('users')
                .returning("*")
                .insert({
                    name: name,
                    email: loginEmail[0].email,
                    joined: new Date()
                }).then(user => {
                    res.json(user[0])
                })
        }).then(trx.commit).catch(trx.rollback)

    })

        // db('users').returning('*').insert({
        //         name: name,
        //         email: email,
        //         joined: new Date()
        
        //     }).then(user => {
        //         bcrypt.hash(password, null, null, function(err, hash) {    
        //             db('login').insert({
        //                 email: email,
        //                 hash: hash
        //             }).then(() => {
        //                 console.log("Login Cadastrado com sucesso")
        //             })
        //         })
        //         res.json(user[0])
        //     }).catch(() => {
        //         res.send("Erro ao cadastrar")
        //     })  
})

app.get('/profile/:id', (req, res) => {
    const { id } = req.params
    db.select('*').from('users').where({id})
        .then(user => {
            if (user.length) {
                res.json(user[0])
            } else {
                res.json('User not found')
            }
        }).catch(() => {
            res.json("Error! try again later")
        })
})

app.put('/image', (req, res) => {
    const { id, imageUrl } = req.body
    console.log(req.body)
    
    stub.PostModelOutputs(
        {
            model_id: "face-detection",
            inputs: [{data: {image: {url: imageUrl}}}]
        },
        metadata,
        (err, response) => {
            if (err) {
                console.log("Error: " + err);
                return;
            }
    
            if (response.status.code !== 10000) {
                console.log("Received failed status: " + response.status.description + "\n" + response.status.details);
                return;
            }
    
            console.log("Predicted concepts, with confidence values:")
            db('users').where('id', '=', id)
                .increment('entries')
                .returning('entries')
                .then(ent => console.log(ent[0].entries))
                .catch(err => console.log(err))
            // console.log(response.outputs[0].data.regions[0].region_info.bounding_box)
            res.json(response.outputs[0].data.regions[0].region_info.bounding_box)
        }
    );

    console.log(imageUrl)
})

app.listen(3001, () => {
    console.log('server is runing in port 3001')
})