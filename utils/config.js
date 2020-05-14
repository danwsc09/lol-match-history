require('dotenv').config()

const MONGODB_URI = process.env.MONGODB_URI
const PORT = process.env.PORT
const APIKEY = process.env.RIOT_API_KEY

const apiData = {
    api: "https://na1.api.riotgames.com",
    typeSummonersId: "/lol/summoner/v4/summoners/by-name",
    typeMatchList: "/lol/match/v4/matchlists/by-account",
    typeMatch: "/lol/match/v4/matches",
}
const URLSummonersId = `${apiData.api}${apiData.typeSummonersId}/`
const URLMatchList = `${apiData.api}${apiData.typeMatchList}/`
const URLMatchID = `${apiData.api}${apiData.typeMatch}/`
const itemURL = "http://ddragon.leagueoflegends.com/cdn/10.7.1/img/item/";

const queueJSON = require('../jsonfiles/queues.json');
const seasonJSON = require('../jsonfiles/seasons.json');
const championJSON = require('../jsonfiles/championContent.json');
const itemJSON = require('../jsonfiles/itemOrganized.json');
const summonerSpellJSON = require('../jsonfiles/summonerOrganized.json');
const runesJSON = require('../jsonfiles/runesReforgedOrganized.json');

const timer = (ms) => {
    return new Promise(res => setTimeout(res, ms))
}

module.exports = {
    MONGODB_URI, PORT, APIKEY, apiData, URLSummonersId, URLMatchList,
    URLMatchID, itemURL, queueJSON, seasonJSON, championJSON, itemJSON,
    summonerSpellJSON, runesJSON, timer
}