"use strict";

var fs = require('fs');
var sys = require('sys');

var _replaces = [];
var _cache = {};

var _rblock = /\{\{\s*block:([^}]+)\s*\}\}/g;
var _roblock = /\{\{\s*block\s+([^}]+)\s*\}\}/;
var _rcblock = /\{\{\s*\/block\s*\}\}/;
var _rinclude = /\{\{\s*(include|extend)\s+([^\}]+)\s*\}\}[\r\n]*/g;


var _transform = {
	'if ([^}]+)': function (a, b){ return "if( "+_safeVar(b)+" ){" },
	'else if ([^}]+)': function (a, b){ return "} else if( "+_safeVar(b)+" ){" },
	'/(foreach|if)': '}',

	'foreach (:var) as (:var)(?: => (:var))?': function (a, items, key, val){
		if( !val ){
			val	= key;
			key = '__i';
		}
		return 'for( var '+key+' = 0, __n = '+_safeVar(items, '[]')+'.length, '+val+'; '+key+' < __n; '+key+'++ ){ '+val+' = '+_safeVar(items+'['+key+']')+';';
	},

	// Short Filter
	'(:var)\\((:var)\,\s*([^)]+)\\)([^}]+)': function (a, items, key, expr, last){
		return	items+'.forEach(function ('+key+'){ if( '+expr+') this.push('+key+last+'); }, this);';
	},

	// Filter
	'filter (:var) as (:var) => ([^}]+)': function (a, items, key, expr){
		return	'}); '+items+'.forEach(function ('+key+'){ if( '+expr+') this.chunk(function (){ ';
	},
	'/filter': ' }); }, this); this.chunk(function (){',

	'pull (:var)': '});\nthis.pull("$1", function ($1){\nthis.chunk(function (){ ',
	'pullSync (:var)': '});\nthis.pullSync("$1", function ($1){\nthis.chunk(function (){ ',
	'/pull': '\n});\n});\nthis.chunk(function (){ \n'
};



for( var key in _transform ){
	_replaces.push([_regexp(key), _replacement(_transform[key])]);
}


function _regexp(regexp){
	regexp = regexp
				.replace(/\s/g, '\\s+')
				.replace(/:var/g, '[\\w\\d.\\[\\]]+')
			;
	return	new RegExp('\\{\\{\\s*'+ regexp +'\\s*\\}\\}[\\r\\n]*', 'gi');
}


function _replacement(func){
	if( typeof func == 'string' ){
		return	"'); "+func+" this.push('";
	} else {
		return function (){ return _replacement( func.apply(null, arguments) ); };
	}
}


function _build(str, inner){
	str = String(str).replace(_rinclude, function (a, type, filename){ return _build(fs.readFileSync(filename), true); });

	if( !inner ){
		var open, close, blocks = {}, name, len;
		while( (open = str.search(_roblock)) != -1 ){
			name = RegExp.$1;
			len = RegExp.lastMatch.length;
			close = str.search(_rcblock, open+len);
			blocks[name] = str.substring(open+len, close);
			str = str.substr(0, open) + str.substr(close+RegExp.lastMatch.length);
		}

		return	str.replace(_rblock, function (a, name){ return blocks[name] || ''; }).replace(/\n/g, "\\n").replace(/'/g, '\\\'');
	}

	return str;
}

function _safeVar(expr, def){
	//return	'(function(){ try { return '+expr+'; } catch (x) { return '+def+'; } })()';
	return	expr;
}

function _template(filename, func){
	if( !(filename in _cache) && func ){
		fs.readFile(filename, function (err, str){
			str = _build(str);

			_replaces.forEach(function (replace){ str = str.replace(replace[0], replace[1]); });

			str = str
					.replace(/[\r\t]/g, " ")
					.replace(/\{\{([^}]+)\}\}/g, function (a, b){
						return	'\', this.escape('+_safeVar(b, "")+'), \'';
					})
				;

			//console.log('this.chunk(function (){\nthis.push(\''+ str +'\');\n});');
			//return;
			_cache[filename] = new Function ('data', 'with( data ){ this.chunk(function (){\nthis.push(\''+ str +'\');\n}); }');
			func(_cache[filename]);
		});
	}
	return _cache[filename];
}



/**
 * @Tpl
 */
function Tpl(filename){
	if( !(this instanceof Tpl) ){
		return	new Tpl(filename);
	}

	this._filename	= filename;
	this._tpl 		= _template(filename);
	this._data		= {};
}
Tpl.preload = function (filename){
	_template(filename, function (){});
};

Tpl.prototype._fetch = function (tpl){
	this.emit('start');
	var reader = new Reader(this.emit.bind(this, 'data'), this.emit.bind(this, 'end'));
	if( tpl ){
		this._tpl = tpl;
	}
	this._tpl.call(reader, this._data);
	reader.read(this);
};

Tpl.prototype.set = function (data){
	for( var key in data ){
		this._data[key]	= data[key];
	}
	return	this;
};

Tpl.prototype.fetch = function (){
	if( this._tpl ){
		this._fetch();
	} else {
		_template(this._filename, this._fetch.bind(this));
	}
};

Tpl.prototype.on = function (name, fn){
	if( !this._events ) this._events = {};
	this._events[name]	= fn;
	return	this;
};

Tpl.prototype.emit = function (name, data){
	this._events[name].call(this, data);
};

Tpl.prototype.one = function (name, func){
	this.on(name, function __(data){
		delete this._events[name];
		func.call(this, data);
	}.bind(this));
	return	this;
};



/**
 * @Reader
 */
function Reader (onData, onEnd){
	this._hold		= false;
	this._chunks	= [];
	this._async		= {};
	this._data		= [];
	this._ondata	= onData;
	this._onend		= onEnd
}

Reader.prototype.chunk = function (func, first){
	this._chunks[first ? 'unshift' : 'push'](func);
};

Reader.prototype.pullSync = function (name, func, uid, first){
	this._chunks[first ? 'unshift' : 'push']([name, func, uid]);
};

Reader.prototype.pull = function (name, func){
	var uid = +new Date;
	this.chunk(function (){ this.push('<span id="'+uid+'">Loading...</span>'); });
	if( !(name in this._async) )
		this._async[name] = [];
	this._async[name].push([func, uid]);
};

Reader.prototype._next = function (tpl, skip){
	if( skip ) this._chunks.shift();
	this._read(tpl);
};

Reader.prototype._pushResult = function (uid, name, res){
	this._chunks.shift();

	if( name in this._async ){
		var chunk;
		while( chunk = this._async[name].shift() ){
			this.pullSync(name, chunk[0], chunk[1], true);
		}
	}

	if( uid ){
		res = '<script>document.getElementById("'+uid+'").innerHTML = \''+ res.replace(/\n/g, '\\\n') + '\';</script>';
	}

	this.chunk(function (){ this.push( res ); }, true);
};

Reader.prototype._read = function (tpl){
	if( !this._hold ){
		var chunk, chunks = this._chunks;

		if( chunks.length ){
			chunk = chunks[0];

			if( chunk.length ){
				this._hold = true;

				_pull(tpl, chunk[0], chunk[1], function (res){
					this._pushResult(chunk[2], chunk[0], res);
					this._hold = false;
					this._read(tpl);
				}.bind(this));
			} else {
				var res = [];
				res.escape = escapeHtml;
				chunk.call( res );
				this._ondata( res.join('') );
				this._next(tpl, true);
			}
		}
		else {
			this._onend();
		}
	}
};

Reader.prototype.read = function (tpl){
//	this._chunks = this._chunks;
	console.log('chunks:', this._chunks.length);
	this._read(tpl);
};



function _pull(tpl, name, tplPart, onEnd){
	var key = name+'.pull', func = function (result){
		var
			  data = []
			, reader = new Reader(function (chunk){ data.push(chunk); }, function (){ onEnd( data.join('') ); })
		;
		tplPart.call(reader, result);
		reader.read(tpl);
	};


	if( (key in tpl) && (tpl[key] !== 1) ){
		func( tpl[key] );
	} else {
		tpl.one(name+'.result', func);
		if( !(key in tpl) ){
			tpl[key] = 1;
			tpl.emit(key, function (result){
				tpl[key] = result;
				tpl.emit(name+'.result', result);
			});
		}
	}
}


module.exports = Tpl;

var HCHARS = /[&<>\"]/,
    AMP    = /&/g,
    LT     = /</g,
    GT     = />/g,
    QUOT   = /\"/g;

 function escapeHtml(s) {
	if (typeof s === "string") {
		if (!HCHARS.test(s)) {
			return s;
		}
		return s.replace(AMP,'&amp;').replace(LT,'&lt;').replace(GT,'&gt;').replace(QUOT,'&quot;');
	}
	return s;
}
