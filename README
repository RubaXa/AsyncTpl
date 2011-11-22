# AsyncTpl

Is a asynchronous template engine for nodejs or the browser.


## Features

	* XML or Smarty sintaxis
	* async/streaming operation
	* browser/node compatibility
	* fastest


## Usage

### NodeJS

#### index.js
```js
	var xtpl = require('./lib/AsyncTpl').engine('XML');

	xtpl.NS = 'xtpl';
	xtpl.ASYNC = true;
	xtpl.STREAM = false;
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

### Brwoser

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


## Support TAGS

### text
```html
	<xtpl:text>Hello</xtpl:text>
```
```html
	<div>Hello</div>
```


### value
```html
	<xtpl:value>ctx.value</xtpl:value>
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
	<xtpl:choose>
		<xtpl:when test="ctx.myVar">...</xtpl:when>
		<xtpl:otherwise>...</xtpl:otherwise>
	</xtpl:choose>
```


### foreach
```html
	<xtpl:template>
		<xtpl:foreach iterate="ctx.items" as="val">
			<xtpl:value>val</xtpl:value>
		</xtpl:foreach>
		<xtpl:foreach iterate="ctx.subitems" as="val" index="key">
			<xtpl:value>key</xtpl:value>
			<xtpl:text>. </xtpl:value>
			<xtpl:value>val</xtpl:value>
		</xtpl:foreach>
	</xtpl:template>
```


### if
```html
	<xtpl:if test="true">
		<xtpl:text>true</xtpl:text>
	</xtpl:if>
```


### include
```html
	<xtpl:include src="./text.xml"/>
```


### pull
```html
	<xtpl:template>
		<xtpl:pull name="sync">
			<xtpl:success><xtpl:value>sync</xtpl:value></xtpl:success>
		</xtpl:pull>
		<xtpl:pull name="fail" error="error">
			<xtpl:fail><xtpl:value>error</xtpl:value></xtpl:fail>
		</xtpl:pull>
		<xtpl:pull name="async" async="async">
			<xtpl:loading>...</xtpl:loading>
			<xtpl:success><xtpl:value>async</xtpl:value></xtpl:success>
		</xtpl:pull>
	</xtpl:template>
```


### script
```html
	<xtpl:template>
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
	</xtpl:template>
```
```html
	<div>true</div><b>global</b>
```
