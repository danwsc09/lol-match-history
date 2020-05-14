const mongoose = require('mongoose')

const matchSchema = new mongoose.Schema({
    accId: String,
    blueTeamWin: Boolean,
    champion: String,
    description: String,
    gameCreation: Number,
    gameDuration: Number,
    gameMode: String,
    map: String,
    matchId: Number,
    patch: String,
    playersInformation: Array,
    role: String,
    season: String
})

matchSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
})
matchSchema.index( { accId: 1, matchId: 1 }, { unique: true } )

module.exports = mongoose.model('Match', matchSchema)