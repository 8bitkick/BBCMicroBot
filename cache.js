const BotGenesis = 1569394800; // First ever bot tweet 25 Sep 2019

async function cache(toot, beebState){

  	// Were assuming single thread sequential URL generation here...
  	let num = Math.floor(Date.now()/1000) - 1569394800;
  	let digits = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  	let len = Math.min(digits.length, 62);
  	let short_url = '';
  	while (num > 0) {
  		short_url = digits[num % len] + result;
  		num = parseInt(num / len, 10);
  	}





return "dummy"
}

module.exports = cache;
