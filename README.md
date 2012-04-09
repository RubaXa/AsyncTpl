# AsyncTpl

Is a asynchronous template engine for nodejs or the browser.


## Features

* XML, Smarty or custom syntaxis
* async/streaming operation
* [compile](#compile-errors) & [run-time](#run-time-errors) errors
* browser/nodejs compatibility
* [high performance](http://rubaxa.github.com/AsyncTpl/benchmark/index.html)
* 10KB (minified + gzipped)


## Usage

### NodeJS

#### index.js
```js
var xtpl = require('./lib/AsyncTpl').engine('XML');

// Setup XML
xtpl.NS     = 'xtpl';   // namespace
xtpl.ASYNC  = true;     // async include templates
xtpl.STREAM = false;    // streaming
xtpl.ESCAPE = true;     // html escape all variables
xtpl.DEBUG  = true;     // compile & run-time errors (console.log)
xtpl.ROOT_DIR       = './tpl/';
xtpl.COMPILE_DIR    = './tpl_c/';

http.createServer(function (req, res){
	res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
	xtpl.fetch(
	  'index.xml'
	, {
		  text: 'Yahoo!'
		, items: [{ selected: true, href: '/', text: 'index' }, { href: '/page', text: 'page' }]
	}
	, function (result){
		res.end(result);
	});
}).listen(8082);
```

#### default.xml -- default page
```html
<?xml version="1.0"?>
<xtpl:template xmlns:xtpl="http://rubaxa.org/">
	<xtpl:doctype mode="xhtml"/>
	<html>
		<head>
			<meta charset="utf-8"/>
			<title xtpl:get="title">Default page</title>
		</head>
		<body>
			<div xtpl:get="nav" class="nav"/>

			<div class="content">
				<xtpl:get name="content">
					default content
				</xtpl:get>
			</div>

			<footer>
				<b>Date:</b>
				<xtpl:space/>
				<span xtpl:val="(new Date).toString()"/>
			</footer>
		</body>
	</html>

	<xtpl:tag name="button" context="btn">
		<a href="{*btn.href*}" class="btn btn_type-{*btn.type*}">
			<span class="btn__txt">
				<xtpl:tag-inner/>
			</span>
		</a>
	</xtpl:tag>
</xtpl:template>
```

#### index.xml -- index page, based on default.xml
```html
<?xml version="1.0"?>
<xtpl:template xmlns:xtpl="http://rubaxa.org/">
	<xtpl:include src="example-page.xml" />

	<xtpl:set name="title">AsyncTpl :: XML</xtpl:set>

	<ul xtpl:set="nav" xtpl:inner-foreach="ctx.items as item">
		<li>
			<xtpl:attrs>
				<xtpl:attr name="class">
					<xtpl:text value="nav__item"/>
					<xtpl:if test="item.selected"><xtpl:space/>nav__item_selected</xtpl:if>
				</xtpl:attr>
			</xtpl:attrs>
			<a href="{*item.href*}" xtpl:tag-if="!item.selected">
				<xtpl:value>item.text.toUpperCase()</xtpl:value>
			</a>
		</li>
	</ul>

	<xtpl:set name="content">
		<p>
			<b>text:</b>
			<xtpl:space/>
			<span xtpl:val="ctx.text"/>
		</p>
		<xtpl:button href="/welcome" type="submit">GO!</xtpl:button>
	</xtpl:set>
</xtpl:template>
```

#### HTML result
```html
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html>
<head>
	<meta charset="utf-8"/>
	<title>AsyncTpl :: XML</title></head>
<body>
	<div class="nav">
		<ul>
			<li class="nav__item nav__item_selected">INDEX</li>
			<li class="nav__item"><a href="/page">PAGE</a></li>
		</ul>
	</div>
	<div class="content">
		<p><b>text:</b> <span>Yahoo!</span></p>
		<a href="/welcome" class="btn btn_type-submit"><span class="btn__txt">GO!</span></a>
	</div>
	<footer>
		<b>Date:</b> <span>Sun Apr 08 2012 20:12:05 GMT+0400 (MSK)</span>
	</footer>
</body>
</html>
```


--------------------------


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

--------------------------

## Support XML

* [if](#if)
* [include](#include)
* [assign](#assign)
* [tag](#tag)
* [block](#block): `get & set`
* [choose](#choose): `when & otherwise`
* [foreach](#foreach): `iterate, as & index`
* [node xtpl:attrs](#xattrs)
* [part](#part)
* [pull](#pull): `loading, fail & success`
* [script](#script)
* [text](#text)
* [value](#value)
* [comment](#comment)
* [attributes](#attributes)
* [closure](#closure)
* [doctype](#doctype)


<a name="if"></a>
### if
```html
<xtpl:if test="true">
	<xtpl:text>true</xtpl:text>
</xtpl:if>
```
```html
true
```

<a name="include"></a>
### include
```html
<xtpl:include src="./filename.xml"/>
```

<a name="assign"></a>
### assign
```html
<?xml version="1.0"?>
<xtpl:template xmlns:xtpl="http://rubaxa.org/">
	<xtpl:assign name="slash" value="/" />
	<xtpl:assign name="ctx.double.slashes" value="//" />
	<xtpl:assign name="url.protocol" value="http:" />
	<xtpl:assign name="url.hostname" value="rubaxa.org" />

	<xtpl:value>url.protocol</xtpl:value>
	<xtpl:value>ctx.double.slashes</xtpl:value>
	<xtpl:value>url.hostname</xtpl:value>
	<xtpl:value>slash</xtpl:value>
</xtpl:template>
```
```html
http://rubaxa.org/
```

<a name="tag"></a>
### tag
```html
<?xml version="1.0"?>
<xtpl:template xmlns:xtpl="http://rubaxa.org/">
	<xtpl:tag name="subscribe-form" context="form">
		<form action="{*form.action*}" method="{*form.method*}">
			<xtpl:tag-inner/>
			<hr/>
			<xtpl:button value="{*form.submit*}" type="submit"/>
		</form>
	</xtpl:tag>

	<xtpl:tag name="button">
		<input value="{*tag.value*}" type="{*tag.type*}" class="btn btn_type-{*tag.type*}"/>
	</xtpl:tag>

	<xtpl:subscribe-form action="/subscribe/add" method="POST" submit="  OK  ">
		<h2>Email subscribe</h2>
		<fieldset>
			<label>E-mail: <input name="email" type="text"/></label>
		</fieldset>
	</xtpl:subscribe-form>
</xtpl:template>
```
```html
<form action="/subscribe/add" method="POST">
	<h2>Email subscribe</h2>
	<fieldset>
		<label>E-mail: <input name="email" type="text"/></label>
	</fieldset>
	<hr/>
	<input value="  OK  " type="submit" class="btn btn_type-submit"/>
</form>
```

<a name="block"></a>
### block
```js
var ctx = { items: [5,10] }
```
```html
<?xml version="1.0"?>
<xtpl:template xmlns:xtpl="http://rubaxa.org/">
	<xtpl:get name="first"/>
	<xtpl:get name="second">
		second
	</xtpl:get>

	<xtpl:set name="first" test="false">1</xtpl:set>
	<xtpl:set name="first">1.1</xtpl:set>

	<xtpl:set name="attrs">
		<xtpl:value>attrs[0]+attrs[1]</xtpl:value>
	</xtpl:set>

	<xtpl:space/>
	<xtpl:get name="attrs" attrs="ctx.items"/>
	<xtpl:text value="-"/>

	<xtpl:set name="attrs-name" attrs-name="val">
		<xtpl:value>val</xtpl:value>
	</xtpl:set>
	<xtpl:get name="attrs-name" attrs="5"/>

	<xtpl:text value="="/>

	<xtpl:get name="attrs-attrs" result="10"/>
	<xtpl:set name="attrs-attrs">
		<xtpl:value>result</xtpl:value>
	</xtpl:set>
</xtpl:template>
```
```html
1.1 second 15-5=10
```

<a name="choose"></a>
### choose
```html
<?xml version="1.0"?>
<xtpl:template xmlns:xtpl="http://rubaxa.org/">
	<div>
		<xtpl:choose>
			<xtpl:when test="true">OK</xtpl:when>
			<xtpl:when test="false">FAIL</xtpl:when>
			<xtpl:otherwise>Hmmmm</xtpl:otherwise>
		</xtpl:choose>
	</div>
</xtpl:template>
```
```html
<div>OK</div>
```

<a name="foreach"></a>
### foreach
```js
ctx = { items: [1,2], colors: ['white', 'black'] };
```
```html
<xtpl:template xmlns:xtpl="http://rubaxa.org/">
	<xtpl:foreach from="1" to="3" as="idx">
		<xtpl:value>idx</xtpl:value>
	</xtpl:foreach>
	<xtpl:text value=":"/>

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

	<ul xtpl:inner-foreach="[2,8] as val">
		<li><xtpl:value>val</xtpl:value></li>
	</ul>
</xtpl:template>
```
```html
123:12<ul><li>1. white</li><li>2. black</li></ul><ul><li>2</li><li>8</li></ul>
```


<a name="xattrs"></a>
### node xtpl:attrs
```js
ctx = {
	  hasNav:	true
	, hasPrev:	false
	, hasNext:	true
};
```
```html
<xtpl:template xmlns:xtpl="http://rubaxa.org/">
	<div>
		<p xtpl:if="ctx.hasNav"><a href="#prev" xtpl:tag-if="ctx.hasBack">prev</a> | <a xtpl:tag-if="ctx.hasNext" href="#next">next</a></p>
		<div xtpl:if="!ctx.hasNav">nav:disabled</div>
		<div class="sidebar" xtpl:get="sidebar"></div>
		<ul xtpl:set="sidebar" xtpl:inner-foreach="{a:1,b:2} as key => val"">
			<li><xtpl:value>key</xtpl:value>. <xtpl:value>val</xtpl:value></li>
		</ul>
		<b xtpl:foreach="[1,2,3,4] as val" xtpl:tag-if="val%2">
			<xtpl:value>val</xtpl:value>
		</b>
	</div>
</xtpl:template>
```
```html
<div>
	<p>prev | <a href="#next">next</a></p>
	<div class="sidebar">
		<ul xtpl:set="sidebar">
			<li>a. 1</li>
			<li>b. 2</li>
		</ul>
	</div>
	<b>1</b>2<b>3</b>4
</div>
```


<a name="part"></a>
### part
```js
ctx = { __part: 'first-part' };
```
```html
<xtpl:template xmlns:xtpl="http://rubaxa.org/">
	<xtpl:set name="second">second</xtpl:set>
	<xtpl:text>[</xtpl:text>
	<xtpl:part name="first-part">
		<xtpl:get name="first"/><xtpl:text>-</xtpl:text><xtpl:get name="second"/>
	</xtpl:part>
	<xtpl:set name="first">first</xtpl:set>
	<xtpl:text>]</xtpl:text>
</xtpl:template>
```
```html
first-second
```


<a name="pull"></a>
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


<a name="script"></a>
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

<a name="text"></a>
### text
```html
<xtpl:text>Hello</xtpl:text>
```
```html
<div>Hello</div>
```

<a name="value"></a>
### value
```html
<i><xtpl:value>ctx.value</xtpl:value></i>
<b xtpl:val="ctx.name"/>
```
```html
<i>MyValue</i><b>%username%</b>
```


<a name="comment"></a>
### comment
```html
<xtpl:comment>comment</xtpl:comment>
```
```html
<!--comment-->
```

<a name="attributes"></a>
### attributes
```js
ctx = {
	  href: 'http://site.org/link.html'
	, title: 'click me'
	, protocol: 'http:'
	, hostname: 'rubaxa.org'
}
```
```html
<a href="{* ctx.href *}" title="{*ctx.title*}" class="link">link.html</a>

<a>
	<xtpl:attrs>
		<xtpl:attr name="href">
			<xtpl:value>ctx.protocol</xtpl:value>
			<xtpl:value>ctx.domain</xtpl:value>
			<xtpl:get name="page" />
		</xtpl:attr>
		<xtpl:attr name="class">link</xtpl:attr>
	</xtpl:attrs>
	<xtpl:text>test</xtpl:text>
</a>
<xtpl:set name="page">inde.html</xtpl:set>
```
```html
<a href="http://site.org/link.html" title="click me" class="link">link.html</a><a href="http://rubaxa.org/index.html" class="link">test</a>
```

<a name="closure"></a>
### closure
```js
ctx = { first: 1, second: 2 };
```
```html
<xtpl:closure a="ctx.first" b="ctx.second">
	<xtpl:value>a</xtpl:value>
	<xtpl:text>+</xtpl:text>
	<xtpl:value>b</xtpl:value>
	<xtpl:text>=</xtpl:text>
	<xtpl:value>a+b</xtpl:value>
</xtpl:closure>
```
```html
1+2=3
```


<a name="doctype"></a>
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


<a name="compile-errors"></a>
### Compile errors
```html
<?xml version="1.0"?>
<xtpl:template xmlns:xtpl="http://rubaxa.org/">
    <xtpl:space/>
	<xtpl:foreach as="i">
        <xtpl:value>i</xtpl:value>
    </xtpl:foreach>
</xtpl:template>
```
```html
Error: Tag "foreach", attribute "iterate" is missing in /my/template.xml on line 4
```


<a name="run-time-errors"></a>
### Run-time errors
```html
<?xml version="1.0"?>
<xtpl:template xmlns:xtpl="http://rubaxa.org/">
	<xtpl:script>
	    <![CDATA[
	    variable = true;
	    ]]>
	</xtpl:script>
</xtpl:template>
```
```html
Error: variable is not defined in /my/template.xml on line 3
```


### Custom tags (draft)
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
	.fn({
		funcName: function (attrs, ctx){
			return attrs['a']+attrs['b'];
		}
	})

	// Add custom modifiers
	.modifiers({
		modName: function (val, arg1, arg2){
			reutrn val.substr(arg1, arg2);
		}
	})
;


smarty.fetch('my.tpl', {}, function (res){  });
```
