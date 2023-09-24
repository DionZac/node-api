var database = require('./modules/db/database.js');
var glib = require('./glib.js');



var fn = () => {
    var dates = {};
var data = [];

var bets = [];
for(let single of singles.items) bets.push(single);
for(let _live of live.items) bets.push(_live);

for(let bet of bets){
    let bet_profit = bet.profit - bet.bet_value;

    if(bet.date in dates){
        data[dates[bet.date]][1] += bet_profit;
    }
    else{
        let timestamp = new Date(bet.date).getTime();
        data.push([
            timestamp,
            bet_profit
        ]);
        dates[bet.date] = data.length - 1;
    }
}

data = data.sort((a,b) => {
    if(a[0] > b[0]) return 1;
    return -1
});

for(let i=1; i<data.length; i++){
    data[i][1] += data[i-1][1]
}

         Highcharts.stockChart('dashboard', {
             chart: {
                height: 800,
                 style: {
                    fontSize: '1.3em'
                 }
             },
             stockTools: {
      gui: {
        enabled: false // disable the built-in toolbar
      }
    },
        rangeSelector: {
          selected: 1
        },
    
        title: {
          text: 'Total Profit'
        },
    
        series: [{
          name: 'Bets Profit',
          data: data,
          tooltip: {
            valueDecimals: 2
          }
        }]
      });
    }
    fn()

// var total = 0;
// for(var date in dates){
//     total += dates[date];

//     data.push([
//         new Date(date).getTime(),
//         total.toFixed(2)
//     ])
// }

db = new database();

var fn = async () => {
    // initialize settings from 'settings.json' file ///
    try {
        var settings = await glib.readJSONfile('./settings.json')
        try { settings = JSON.parse(settings); }
        catch (err) { }

        // Update the corresponding variables of Database Global object //
    db.settings.DB_FILE = settings.DB_FILE;
    db.settings.DB_LOG = settings.DB_LOG;
    db.settings.DB_ENGINE = settings.DB_ENGINE;
      }
      catch (err) {
        console.log(err);
        throw new Error("Invalid or missing 'settings.json' file.")
      }


    await db.init();
    await db.engine.connect();

    let totalBets =0, totalWonBets=0, totalLostBets=0,
    totalValuePlaced=0, totalReturns=0, totalProfit=0;

    var singles = await db.singles.filter({date:'2023-09-23', account_uid: '91w4brrj7r'});
    console.log(singles);
    for(let single of singles){
        // if(single.date == '2023-09-24'){
            totalBets++;
            totalValuePlaced += single.bet_value;
            totalReturns += single.profit;

            if(single.bet.bet_result == "YES"){
                totalWonBets ++;
            }
            else{
                totalLostBets ++;
            }
        // }
    }

    var lives = await db.live.filter({date:'2023-09-23', account_uid: '91w4brrj7r'});
    console.log(lives);
    for(let live of lives){
        // if(live.date == '2023-09-24'){
            totalBets++;
            totalValuePlaced += live.bet_value;
            totalReturns += live.profit;

            if(live.bet.bet_result == "YES"){
                totalWonBets ++;
            }
            else{
                totalLostBets ++;
            }
        // }
    }

    totalProfit = totalReturns - totalValuePlaced;

    console.log('Total Bets Played : ' + totalBets);
    console.log('Total Euro Placed : ' + totalValuePlaced.toFixed(2) + '€' );
    console.log('Total Bets Won : ' + totalWonBets);
    console.log('Total Returns : ' + totalReturns.toFixed(2));

    console.log('=========================================');
    console.log('==');
    console.log('=========================================');

    console.log('Total Profit Of the Day :  ' + totalProfit.toFixed(2) + '€');
}

fn();