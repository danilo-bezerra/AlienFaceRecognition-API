const express = require('express');
const bcrypt = require('bcrypt-nodejs')
const cors = require('cors')
const knex = require('knex')

const app = express()
const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      port : 5432,
      user : 'postgres',
      password : 'pass',
      database : 'alienfacerecognition'
    }
})

app.use(express.json())
app.use(cors())

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
    const { id } = req.body
    db('users').where('id', '=', id)
        .increment('entries')
        .returning('entries')
        .then(ent => res.json(ent[0].entries))
        .catch(err => res.json(err))

})

app.listen(3001, () => {
    console.log('server is runing in port 3001')
})