var Tpl = require('./lib/AsyncTpl');
var example = '{{include ./tpl/bench.html}}';

console.time('compiler');
Tpl(example)
	.set({
		checknew: JSON.parse(require('fs').readFileSync('checknew.json') + '').data
	})
	.on('start', function (){
		console.timeEnd('compiler');
		console.log('----------------------------------');
		console.time('streem')
	})
	.on("data", function (data){
//		console.log(data);
	})
	.on("end", function (){
		console.log('----------------------------------');
		console.timeEnd('streem');
	})
	.fetch()
;
