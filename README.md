# AsyncTpl

Is a asynchronous template engine for nodejs or the browser.


## Features

* XML or Smarty syntaxis
* async/streaming operation
* browser/node compatibility
* fastest


## Usage

### NodeJS

#### index.js
```js
var xtpl = require('./lib/AsyncTpl').engine('XML');

// Setup XML
xtpl.NS = 'xtpl';      // namespace
xtpl.ASYNC = true;     // aync include templates
xtpl.STREAM = false;   // sreaming
xtpl.ESCAPE = true;    // html escape all variables
xtpl.ROOT_DIR = './tpl/';
xtpl.COMPILE_DIR = './tpl_c/';

http.createServer(function (req, res){
	res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
	xtpl
		.fetch('page.xml', { text: 'Yahoo!' })
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
	<xtpl:value>ctx.text</xtpl:value>
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
		document.getElementById('#Result').inenrHTML = result;
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

* comment `{{* ... *}}`
* foreach + foreachelse
* if, elseif and else
* modifilers: upper, lower, capitalize, nl2br, regex_replace, combining
* include (support only file-attr)
* extends + block

### Usage

```js
var smarty = require('AsyncTpl').engine('Smarty');

smarty.LEFT = '{{';
smarty.RIGHT = '}}';

// Add custom modifiers
smarty.addModifiers({
	modName: function (val, arg1, arg2){ reutrn val.substr(arg1, arg2); }
});

smarty.fetch('my.tpl', {}).then(function (res){
});
```


## Support XML

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
```html
<div>
	<get name="first"/>
	<get name="second">
		second
	</get>
	<set name="first" test="false">1</set>
	<set name="first">1.1 </set>
</div>
```
```html
<div>1.1 second</div>
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
