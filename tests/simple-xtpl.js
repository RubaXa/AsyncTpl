/*global require*/

var xtpl	        = require('../lib/AsyncTpl').engine('XML');
xtpl.ASYNC			= false;
xtpl.STREAM			= false;
xtpl.ROOT_DIR		= './tests/xml/';
xtpl.DEBUG          = false;

var tpl = xtpl.fromString('<?xml version="1.0"?><xtpl:template xmlns:xtpl="http://rubaxa.org/"><div><h1 class="header"><xtpl:value>ctx.header</xtpl:value></h1><h2 class="header2"><xtpl:value>ctx.header1</xtpl:value></h2><h3 class="header3"><xtpl:value>ctx.header2</xtpl:value></h3><h4 class="header4"><xtpl:value>ctx.header3</xtpl:value></h4><h5 class="header5"><xtpl:value>ctx.header4</xtpl:value></h5><h6 class="header6"><xtpl:value>ctx.header5</xtpl:value></h6><ul class="list"><xtpl:foreach from="ctx.list" as="val"><li class="item"><xtpl:value>val</xtpl:value></li></xtpl:foreach></ul></div></xtpl:template>');
var ctx = {
	header: "Header",
	header2: "Header2",
	header3: "Header3",
	header4: "Header4",
	header5: "Header5",
	header6: "Header6",
	list: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
};

// compile
tpl.fetch({}, function (){});

var done = false;
while( !done ){
	tpl.fetch(ctx, function (res){
		done = true;
	});
}
