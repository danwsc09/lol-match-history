// Template for trimming Champion information to obtain only relevant information

// const championJSONData = championJSON.data;
// const organizedChampion = Object.keys(championJSONData).map(key => ({name: key, id: championJSONData[key].key}));
// console.log(organizedChampion);
// const championContent = JSON.stringify(organizedChampion, null, '\t');
// fs.writeFile("./src/json/championContent.json", championContent, function (err) {
//     if (err) {
//         console.log(err);
//     }
//     console.log("The file was saved.");
// })


// Template for trimming item data

// const itemFullData = itemJSON.data;
// const organizedItem = Object.keys(itemFullData).map(key => ({
//     id: key, 
//     name: itemFullData[key].name,
//     link: itemURL + itemFullData[key].image.full
//     }));
// console.log(organizedItem);
// const itemContent = JSON.stringify(organizedItem, null, '\t');
// fs.writeFile("./src/json/itemOrganized.json", itemContent, function (err) {
//     if (err) {
//         console.log(err);
//     }
//     console.log("The file was saved.");
// })

// Template for trimming Summoner Spell data
// const fs = require('fs');
// const summonerJSON = require('./jsonfiles/summoner.json')
// const summonerJSONdata = summonerJSON.data
// const organizedSummoner = Object.keys(summonerJSONdata).map(key => {
//     return {name: summonerJSONdata[key].id,
//     id: summonerJSONdata[key].key}
// })
// console.log(organizedSummoner);
// const organizedSummonerContent = JSON.stringify(organizedSummoner, null, '\t');
// fs.writeFile('./jsonfiles/summonerOrganized.json', organizedSummonerContent, (err) => {
//     if (err) {console.log(err);}
//     console.log('file successfully saved');
// })

