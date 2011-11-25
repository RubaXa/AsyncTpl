# AsyncTpl

Is a asynchronous template engine for nodejs or the browser.


## Features

* XML or Smarty syntaxis
* async/streaming operation
* browser/nodejs compatibility
* [high performance](http://rubaxa.github.com/AsyncTpl/benchmark/index.html)
* 21KB (compressed code) 


## Usage

### NodeJS

#### index.js
```js
var xtpl = require('./lib/AsyncTpl').engine('XML');

// Setup XML
xtpl.NS = 'xtpl';      // namespace
xtpl.ASYNC = true;     // async include templates
xtpl.STREAM = false;   // sreaming
xtpl.ESCAPE = true;    // html escape all variables
xtpl.ROOT_DIR = './tpl/';
xtpl.COMPILE_DIR = './tpl_c/';

http.createServer(function (req, res){
	res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
	xtpl
		.fetch('index.xml', { text: 'Yahoo!' })
		.then(function (result){
			res.end(result);
		})
	;
}).listen(8082);
```

#### page.xml
```html
<?xml version="1.0"?>
<xtpl:template>
	<xtpl:doctype />
	<head>
		<title><get name="title" /></title>
	</head>
	<body>
		<get name="content">empty</get>
		<xtpl:value>(new Date).toString()</xtpl:value>
	</body>
</xtpl:template>
```

#### index.xml
```html
<?xml version="1.0"?>
<xtpl:template>
	<xtpl:include name="page.xml" />
	<xtpl:set name="title">AsyncTpl :: XML</xtpl:set>
	<xtpl:set name="content">
		<xtpl:value>ctx.text</xtpl:value>
	</xtpl:set>
</xtpl:template>
```


### Browser

```html
<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.7/jquery.min.js"></script>
<script src="./lib/AsyncTpl.min.js"></script>

...

<script id="MyTpl" type="text/xml">
	<xtpl:template>
		<xtpl:value>ctx.text</xtpl:value>
	</xtpl:template>
</script>

...

<div id="Result"></div>

<script>
	// Initialization
	var xtpl = AsyncTpl.engine('XML');

	xtpl.fetch('#MyTpl', { text: 'Yahooo!' }).then(function (result){
		document.getElementById('#Result').innerHTML = result;
	});

	// OR
	
	xtpl.fetch('#MyTpl', '#Result', { text: 'Yahooo!' });

	// jQuery
	(function ($){
		// Initialization
		$.tpl('XML');

		$('#Result').tpl('#MyTpl', { text: 'Yahooo!' });
	})(jQuery);
</script>
```

## Support Smarty

* comment: `{{* ... *}}`
* foreach: `foreach, foreachelse`
* if statement: `if, elseif and else`
* modifilers: `upper, lower, capitalize, nl2br, regex_replace, combining`
* functions: `assign`
* `include` (support only file-attr)
* `extends + block`

### Usage

```js
var smarty = require('AsyncTpl').engine('Smarty');

smarty.LEFT = '{{';
smarty.RIGHT = '}}';

smarty
	// Add custom functions
	.fn({ funcName: function (attrs, ctx){ return attrs['a']+attrs['b']; } })

	// Add custom modifiers
	.modifiers({ modName: function (val, arg1, arg2){ reutrn val.substr(arg1, arg2); } })
;


smarty.fetch('my.tpl', {}).then(function (res){
});
```


## Support XML
* [if][] if
* block: `get & set`
* choose: `when & otherwise`
* foreach: `iterate, as & index`
* pull: `loading, fail & success`
* script
* text
* value
* comment
* attributes


### if ###
```html
<xtpl:if test="true">
	<xtpl:text>true</xtpl:text>
</xtpl:if>
```
```html
true
```
