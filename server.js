const express = require('express');
const bcrypt = require('bcrypt-nodejs')
const cors = require('cors')

const app = express()

app.use(express.json())
app.use(cors())

const database = {
    users: [
        {
            id: '1',
            name: 'alien',
            email: 'alien@alien.com',
            password: 'alien@alien.com',
            entities: 0,
            joinDate: new Date(),
        }
    ]
}

app.get('/', (req, res) => {
    res.json(database.users)
})

app.post('/signin', (req, res) => {
    const {email, password} = req.body
    if (email === database.users[0].email && password === database.users[0].password) {
        res.json(database.users[0])
    } else {
        res.status(400).json('Invalid email or password')
    }
})

app.post('/register', (req, res) => {
    const {id, email, password, name, entities} = req.body
    bcrypt.hash(password, null, null, function(err, hash) {
        database.users.push({
            id: id || database.users.length + 1,
            name: name,
            email: email,
            password: hash,
            entities: entities ?? 0,
            joinDate: new Date(),
        })

        res.json(database.users[database.users.length - 1])
    })
})

app.get('/profile/:id', (req, res) => {
    const { id } = req.params
    let found = false
    database.users.forEach(user => {
        if (user.id === id) {
            found = true
            res.json(user)
        }
    })

    if (!found) {
        res.status(400).json('User not found')
    }
})

app.put('/image', (req, res) => {
    const { id } = req.body
    console.log(req.body)
    let found = false
    database.users.forEach(user => {
        if (user.id === id) {
            found = true
            user.entities++
            res.json(user.entities)
        }
    })

    if (!found) {
        res.status(400).json('User not found entities')
    }
})

app.listen(3001, () => {
    console.log('server is runing in port 3000')
})