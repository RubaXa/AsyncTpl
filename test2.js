var utils = require('./lib/utils');
var Context = require('./lib/Context');
var checknew = JSON.parse(require('fs').readFileSync('checknew.json') + '').data;

console.time('all');

var __buf	= [];
var	__res	= func(new Context({ checknew: checknew }), __buf, utils);

console.timeEnd('all');
console.log(__res.length);


function func(__ctx, __buf, __utils) {
	__buf.push('<div> 	');

	var array = [];
	for (var i = 0; i < 100; i++) array.push(i);

	__ctx.set('array', array);
	__buf.push(' 	');


	if( 1 ){
		__ctx.each(__ctx.getVal(["array"]), "i", function(__ctx) {
			__buf.push(' 		');
			__ctx.each(__ctx.getVal(["checknew","messages"]), "message", function(__ctx) {
				__buf.push(' 			<a href="', __ctx.getVal(["message","Id"]), '" style="display:block">', __ctx.getVal(["message","Subject"]), '</a> 		');
			}, __ctx);
			__buf.push(' 	');
		}, __ctx);
	} else {
		__ctx.each(__ctx.get("array").val(), "i", function(__ctx) {
			__buf.push(' 		');

			__ctx.each(__ctx.get("checknew").get("messages").val(), "message", function(__ctx) {
				__buf.push(' 			<a href="', __ctx.get("message").get("Id").val(), '" style="display:block">', __ctx.get("message").get("Subject").val(), '</a> 		');
			}, __ctx);

			__buf.push(' 	');
		}, __ctx);
	}


	__buf.push(' </div> ');

	return	__buf.join('');
}
