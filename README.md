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

### doctype
```html
1. <xtpl:doctype />
2. <xtpl:doctype mode="loose" />
3. <xtpl:doctype mode="strict" />
4. <xtpl:doctype mode="xstrict" />
5. <xtpl:doctype mode="transitional" />
6. <xtpl:doctype mode="xhtml" />
```
```html
1. <!DOCTYPE html>
2. <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
3. <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
4. <!DOCTYPE html PUBLIC  "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
5. <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
6. <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
```


### text
```html
<xtpl:text>Hello</xtpl:text>
```
```html
<div>Hello</div>
```


### value
```html
<div><xtpl:value>ctx.value</xtpl:value></div>
```
```html
<div>myValue</div>
```

### custom tags (draft)
```js
var xtpl = AsyncTpl.engine('XML').tags({
				'menu': function (node){ return node.__close ? '</ul>' : '<ul>'; }
			  , 'item': function (node, attrs){ return node.__close ? '</a></li>' : ['<li>'].concat(this._build('a', attrs)); }
			});
```
```html
<xtpl:menu>
	<xtpl:item href="#0">0</xtpl:item>
	<xtpl:item href="#1">1</xtpl:item>
</xtpl:menu>
```
```html
<ul><li><a href="#0">0</a></li><li><a href="#1">1</a></li></ul>
```


### comment
```html
<xtpl:comment>comment</xtpl:comment>
```
```html
<!--comment-->
```


### attributes
```html
<a href="xtpl:ctx.href" title="xtpl:ctx.title" class="link">link.html</a>
```
```html
<a href="http://site.org/link.html" title="click me" class="link">link.html</a>
```


### block
```js
var ctx { items: [5,10] }
```
```html
<div>
	<xtpl:get name="first"/>
	<xtpl:get name="second">
		second
	</get>
	<xtpl:set name="first" test="false">1</xtpl:set>
	<xtpl:set name="first">1.1 </xtpl:set>

	<xtpl:set name="context" context="val">
		<b><xtpl:value>val[1]-1</xtpl:value></b>
	</xtpl:set>
	<xtpl:get name="context" context="ctx.items"/>
</div>
```
```html
<div>1.1 second</div><b>9</b>
```


### choose
```html
<div>
	<xtpl:choose>
		<xtpl:when test="true">if( true )</xtpl:when>
		<xtpl:when test="false">else if( false )</xtpl:when>
		<xtpl:otherwise>else</xtpl:otherwise>
	</xtpl:choose>
</div>
```
```html
<div>if( true )</div>
```


### foreach
```js
ctx = { items: [1,2], colors: ['white', 'black'] };
```
```html
<div>
	<xtpl:foreach iterate="ctx.items" as="val">
		<xtpl:value>val</xtpl:value>
	</xtpl:foreach>
	<ul>
	<xtpl:foreach iterate="ctx.colors" as="color" index="idx">
		<li>
			<xtpl:value>idx+1</xtpl:value>
			<xtpl:text>. </xtpl:value>
			<xtpl:value>color</xtpl:value>
		</li>
	</xtpl:foreach>
	</ul>
</div>
```
```html
12<ul><li>1. white</li><li>2. black</li></ul>
```


### if
```html
<xtpl:if test="true">
	<xtpl:text>true</xtpl:text>
</xtpl:if>
```
```html
true
```


### include
```html
<xtpl:include src="./filename.xml"/>
```


### pull
```js
ctx = {
	sync: function (next){ next(null, "OK"); },
	fail: function (next){ next("FAIL"); },
	async: function (next){
		loadText('http://site.org/get/text', function (res){
			next(null, res);
		});
	}
}
```
```html
<xtpl:pull name="sync">
	<xtpl:success><xtpl:value>sync</xtpl:value></xtpl:success><
</xtpl:pull>
<xtpl:pull name="fail" error="error">
	<xtpl:fail><xtpl:value>error</xtpl:value></xtpl:fail>
</xtpl:pull>
<xtpl:pull name="async" as="result" async="async">
	<xtpl:loading>...</xtpl:loading>
	<xtpl:success><xtpl:value>result</xtpl:value></xtpl:success>
</xtpl:pull>
```
```html
<span id="1321961774452784">OK</span><span id="132196177445222">FAIL</span><span id="1321961774452602">...</span>end<span id="success1321961774452602" style="display: none">Happy async text!</span><script>(function(a, b){try{a.parentNode.insertBefore(b,a);b.style.display="";a.parentNode.removeChild(a);}catch(er){}})(__utils.$("#1321961774452602"), __utils.$("#success1321961774452602"));</script>
```


### script
```html
<xtpl:script>
<![CDATA[
	ctx.script = 2 < 3;
	var txt = 'global';
]]>
</xtpl:script>
<div>
	<xtpl:value>ctx.script</xtpl:value>
</div>
<b>
	<xtpl:value>txt</xtpl:value>
</b>
```
```html
<div>true</div><b>global</b>
```
