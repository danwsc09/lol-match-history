require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const config = require('./utils/config');
const Match = require('./models/match')

const url = process.env.MONGODB_URI
const accountId = 'OsfA0gJjo7xXVESU4YluVq4EOjz5jdnH5FIgmK_4sXKZpQ';


const timer = async (ms) => {
    return new Promise(res => setTimeout(res, ms))
}

const runThis = async () => {
    try {

        await mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true })
        console.log('Connected to MongoDB');
        

        let response = await axios.get(config.URLMatchList + accountId + `?api_key=${config.APIKEY}`)
        console.log('Fetching match history', response.data)
        let matches = response.data.matches

        // loops over matches (up to 100)
        for (let i = 0; i < matches.length; i++) {
            let match = matches[i]
            
            // if match is in database (check by accountId and matchId), move on to next
            let checkMatches = await Match.find({ accId: accountId, matchId: match.gameId })
            if (checkMatches.length !== 0) continue; // later, change this to break

            // Only allowed 20 API calls per second - wait 1 second every 20 calls to not exceed the limit
            if ( ((i + 1) % 20 === 0) && (i !== matches.length) ) {
                console.log('1 second delay');
                await timer(1000)
            }

            // Obtain queue type, season, and champion played for match
            let queueTypeObj = config.queueJSON.find(queue => queue.queueId === match.queue);
            let seasonObj = config.seasonJSON.find(season => season.id == match.season);
            let championObj = config.championJSON.find(champion => match.champion == champion.id)
            
            // Initialize variables that will be extracted from individual match information
            let role = match.lane;
            let gameVersion, gameMode, gameDuration, gameCreation, blueTeamWin, playersInformation;
            
            let matchData = await axios.get(config.URLMatchID + match.gameId + `?api_key=${config.APIKEY}`);
            console.log("successfully loaded match information" + `${i}th match`);
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

            for (let i = 0; i < 10; i++) {
                let playerFullInfo = matchData.data.participants[i];
                let eachChampion = config.championJSON.find(champion => playerFullInfo.championId == champion.id).name
                let firstSummonerSpell = config.summonerSpellJSON.find(summonerSpell => playerFullInfo.spell1Id == summonerSpell.id).name;
                let secondSummonerSpell = config.summonerSpellJSON.find(summonerSpell => playerFullInfo.spell2Id == summonerSpell.id).name;
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
        } // end for loop over matches.length
        mongoose.connection.close()

    } catch(exception) {
        console.log(exception)
    }
}
// runThis();

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true })
    .then(() => {
        console.log('connected to mongodb');
    })
    .catch(err => {
        console.log('error in connecting to mongodb', err.message);
    })
// Match.deleteMany({})
//     .then(() => {
//         console.log('deleted all matches');
//     })
//     .catch(err => {
//         console.log('could not delete all matches');
//     })

Match.find({})
    .then(matches => {
        console.log('matches found:');
        console.log(matches);
        
    })
    .catch(err => {
        console.log(err);
    })