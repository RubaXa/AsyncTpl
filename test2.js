var utils = require('./lib/utils');
var Context = require('./lib/Context');
var checknew = JSON.parse(require('fs').readFileSync('checknew.json') + '').data;

console.time('all');
//func({ checknew: checknew }, [], utils);
var __buf = [];
func(new Context({ checknew: checknew }), __buf, utils);
//console.log(__buf+'');
console.timeEnd('all');


function func(__ctx, __buf, __utils) {
		__buf.push('<div> 	');
		var array = [];
		for (var i = 0; i < 100; i++) array.push(i);
		__ctx.set('array', array);
		__buf.push(' 	');
		__ctx.each(__ctx.get("array").val(), "i", function(__ctx) {
			__buf.push(' 		');
			__ctx.each(__ctx.get("checknew").get("messages").val(), "message", function(__ctx) {
				__buf.push(' 			<a href="', __ctx.get("message").get("Id").val(), '" style="display:block">', __ctx.get("message").get("Subject").val(), '</a> 		');
			}, this);
			__buf.push(' 	');
		}, this);
		__buf.push(' </div> ');
}
