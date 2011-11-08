var Tpl = require('./lib/AsyncTpl');
var json = JSON.parse(require('fs').readFileSync('checknew.json') + '').data;
var example = '{{include ./tpl/bench-100.html}}';


console.time('compile');
Tpl(example)
	.set({
		checknew: json
	})
	.on('start', function (){
		console.timeEnd('compile');
		console.log('----------------------------------');
		console.time('stream')
	})
	.on("data", function (data){
//		console.log(data);
	})
	.on("end", function (){
		console.log('----------------------------------');
		console.timeEnd('stream');
	})
	.fetch()
;
