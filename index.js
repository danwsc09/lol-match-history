require('dotenv').config();

const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const Match = require('./models/match');
const config = require('./utils/config')
const app = express();
const cors = require('cors');
app.use(cors());
const PORT = process.env.PORT || 3001


mongoose.connect(process.env.MONGODB_URI, { useFindAndModify: false, useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.log('Error in connecting to MongoDB', error.message);
    })

app.use(express.json());
app.use(express.static('build'));

app.set('port', PORT)

app.post('/search', async (request, res, next) => {
    
    try {
        console.log(`Fetching account ID for, ${request.body.name} ...`)
        let response = await axios.get(config.URLSummonersId + request.body.name + `?api_key=${config.APIKEY}`)
        let accountId = response.data.accountId

        console.log('Fetching all matches in the database...');
        let matchHistory = await Match.find({accId: accountId})
        console.log(`Done! Found ${matchHistory.length} matches.`);
        if (matchHistory.length === 0) {
            return res.json([]);
        }
        matchHistory.sort((a, b) => b.gameCreation - a.gameCreation)
        res.json( matchHistory.map(match => match.toJSON()) )
    } catch(exception) {
        console.log(exception);
        if (exception.response.status === 404) {
            return res.status(404).send({error: 'Invalid summoner name'})
        }
        next(exception);
    }

})


app.post('/update', async (request, response, next) => {

    try {
        // Send request to obtain accountId, given username
        console.log('Fetching account ID for', request.body.name)
        let responseRiot = await axios.get(config.URLSummonersId + request.body.name + `?api_key=${config.APIKEY}`)
        let accountId = responseRiot.data.accountId

        // Send request to obtain full match history (past 100 games)
        console.log('Fetching match history')
        let response1 = await axios.get(config.URLMatchList + accountId + `?api_key=${config.APIKEY}`)
        let matches = response1.data.matches
        console.log(`There are ${matches.length} matches in from riot API`);
        

        // loops over many matches, up to one hundred
        for (let i = 0; i < matches.length; i++) {
            let match = matches[i]

            // if match is in database (check by accountId and matchId), move on to next
            console.log('Checking to see if match is in database', `match number ${i}`);
            let checkMatches = await Match.find({ accId: accountId, matchId: match.gameId })

            if (checkMatches.length !== 0) continue; // later, change this to break

            // Only allowed 20 API calls per second - wait 1 second every 20 calls to not exceed the limit
            if ( ((i + 1) % 18 === 0) ) {
                console.log('1 second delay');
                await config.timer(1000)
            }

            // Obtain queue type, season, and champion played for match
            let queueTypeObj = config.queueJSON.find(queue => queue.queueId === match.queue);
            let seasonObj = config.seasonJSON.find(season => season.id == match.season);
            let championObj = config.championJSON.find(champion => match.champion == champion.id)
            
            // Initialize variables that will be extracted from individual match information
            let role = match.lane;
            let gameVersion, gameMode, gameDuration, gameCreation, blueTeamWin, playersInformation, firstSummonerSpell, secondSummonerSpell;
            
            console.log(`Loading ${i}th match`);
            let matchData = await axios.get(config.URLMatchID + match.gameId + `?api_key=${config.APIKEY}`);
            // requestCounter += 1;
            // console.log('Number of requests sent:', requestCounter);
            
            
            gameVersion = matchData.data.gameVersion.split(".").splice(0, 2).join(".");
            gameMode = matchData.data.gameMode;
            gameDuration = matchData.data.gameDuration;
            gameCreation = matchData.data.gameCreation;
            blueTeamWin = matchData.data.teams[0].win === 'Win';
            
            playersInformation = matchData.data.participantIdentities.map(each => {
                return {
                    id: each.participantId, userName: each.player.summonerName
                }
            })

            // Extracts info for each of the 10 players
            for (let i = 0; i < matchData.data.participants.length; i++) {
                let playerFullInfo = matchData.data.participants[i];
                let eachChampion = config.championJSON.find(champion => playerFullInfo.championId == champion.id).name
                
                if (playerFullInfo.spell1Id !== 0) {
                    firstSummonerSpell = config.summonerSpellJSON.find(summonerSpell => playerFullInfo.spell1Id == summonerSpell.id).name;
                }
                if (playerFullInfo.spell2Id !== 0) {
                    secondSummonerSpell = config.summonerSpellJSON.find(summonerSpell => playerFullInfo.spell2Id == summonerSpell.id).name;
                }
                let summonerSpells = [firstSummonerSpell, secondSummonerSpell];
                let keystone = config.runesJSON.find(keystone => playerFullInfo.stats.perk0 == keystone.id);
                let secondary = config.runesJSON.find(secondary => playerFullInfo.stats.perkSubStyle == secondary.id);
                let eachAccountId = matchData.data.participantIdentities[i].player.accountId;

                playersInformation[i] = {...playersInformation[i],
                    champion: eachChampion,
                    items: [playerFullInfo.stats.item0, playerFullInfo.stats.item1, 
                        playerFullInfo.stats.item2, playerFullInfo.stats.item3, 
                        playerFullInfo.stats.item4, playerFullInfo.stats.item5, playerFullInfo.stats.item6],
                    kills: playerFullInfo.stats.kills,
                    deaths: playerFullInfo.stats.deaths,
                    assists: playerFullInfo.stats.assists,
                    totalDamage: playerFullInfo.stats.totalDamageDealtToChampions,
                    summonerSpells: summonerSpells,
                    runes: [keystone, secondary],
                    wards: [playerFullInfo.stats.visionWardsBoughtInGame, playerFullInfo.stats.wardsPlaced, playerFullInfo.stats.wardsKilled],
                    accId: eachAccountId
                };
            }

            let thisMatch = new Match({
                accId: accountId,
                matchId: match.gameId,
                blueTeamWin: blueTeamWin,
                gameCreation: gameCreation,
                gameDuration: gameDuration,
                gameMode: gameMode,
                map: queueTypeObj.map,
                patch: gameVersion,
                role: role,
                season: seasonObj.season,
                champion: championObj.name,
                description: queueTypeObj.description,
                playersInformation: playersInformation,                                
            })
            await thisMatch.save()
            console.log('match successfully saved');

        } // end of for-loop for up to 100 matches

        console.log('Fetching all matches in the database...');
        let matchHistory = await Match.find({accId: accountId})
        console.log(`Done! Found ${matchHistory.length} matches.`);
        if (matchHistory.length === 0) {
            return response.json([]);
        }
        matchHistory.sort((a, b) => b.gameCreation - a.gameCreation)
        response.json( matchHistory.map(match => match.toJSON()) )

    } catch(exception) {
        console.log(exception);
        next(exception);
    }

})


app.listen(PORT, function() {
    console.log(`***SERVER STARTED at port: ${PORT}***`);   
})