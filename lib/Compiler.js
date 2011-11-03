(function (utils, Syntax){
	'use strict';

	var
		  gid = +(new Date)
		, uid = ++gid
	;


	function Compiler(left, right){
		if( this instanceof Compiler ){
			this._left		= left;
			this._right		= right;
			this._blocks	= {};
			this._entry		= [];

			this.entry(Compiler.rules);
		} else {
			return	new Compiler(left, right);
		}
	}

	Compiler.prototype = {
		constructor: Compiler,

	// @private
		_match: function (entry){
			for( var i = 0, n = this._entry.length, res; i < n; i++ ){
				if( res = entry.match(this._entry[i][0]) ){
					res.shift();
					res = this._entry[i][1].apply(this, res.concat(entry));
					return (typeof res == 'string') ? { expr: res } : res;
				}
			}
			return	false;
		},


		_var: function (str, def){
//			return ' ((function(){try{return('+str+')}catch(e){return'+(def || '""')+'}})()) ';
			return Syntax.safe(str);
		},


		_include: function (txt, callback){
			var
				  rinclude = utils.regexp(this._left + '(?:include|extend)\\s+([\\w\\d\\/%\\._-]+)' + this._right, 'g')
				, includes = []
			;

			// "include" processing
			txt = txt.replace(rinclude, function (a, filename){ return uid +'~include~'+ includes.push(filename); });

			var
				  _incLen = includes.length
				, _idxIdx = 0
				, _incOk = function (){ if( ++_idxIdx >= _incLen ) callback(txt); }.bind(this)
			;

			if( _incLen ){
				utils.each(includes, function (filename, idx){
					Compiler.require(filename, function (err, incFile){
						txt = txt.replace(uid+'~include~'+(idx+1), incFile+'');
						_incOk();
					}.bind(this));
				}, this);
			} else {
				callback(txt);
			}
		},


	// @public
		entry: function (entry){
			utils.each(entry, function (fn, expr){
				this._entry.push([utils.regexp('^'+expr, 'i'), fn]);
			}, this);
			return	this;
		},

		build: function (txt, callback){
			var
				  left = this._left
				, right = this._right
				, leftLen = left.length
				, rightLen = right.length
				, entryLeft
				, entryRight
				, pos
				, entry
				, closeBlock = left +'/block'+ right
			;


			// Clean template entry
			txt = (txt+'')
					.replace(utils.regexp(left+'\\s+', 'g'), left)
					.replace(utils.regexp(right+'\\s+', 'g'), right)
				;


			this._include(txt, function (txt){
				txt = txt.replace(/[\r\n]/g, ' ');

				// Cut blocks
				while( (pos = txt.indexOf(closeBlock)) != -1 ){
					entryLeft = txt.lastIndexOf(left + 'block', pos);
					entryRight = txt.indexOf(right, entryLeft);

					entry = utils.trim(txt.substring(entryLeft + leftLen + 5, entryRight));
					this._blocks[entry] = txt.substring(entryRight + rightLen, pos);

					txt	= txt.substr(0, entryLeft)
							+ (uid +'~block~'+ entry)
							+ txt.substr(pos + closeBlock.length)
						;
				}

				// Past blocks
				utils.each(utils.keys(this._blocks), function (name){
					txt = txt.replace(uid+'~block~'+name, this._blocks[name]);
				}, this);


				// Remove blocks labels
				txt = txt.replace(utils.regexp('\\b'+uid+'~block~\\w+\\b', 'g'), '');


				// Template compilation
				var res = ['this.chunk(function(){ __buf.push(\''], match;
				while( (entryLeft = txt.indexOf(left)) != -1 ){
					entryRight	= txt.indexOf(right, entryLeft);

					if( !~entryRight ){
						throw "compilation";
					}

					entry = txt.substring(entryLeft + leftLen, entryRight);
					res.push(txt.substr(0, entryLeft));

					if( match = this._match(entry) ){
						if( match.type != 'open' ) res.push('\');'); // close push
						if( match.chunk ) res.push('});'); // close previous chunk
						if( match.expr ) res.push(match.expr); // past expresion
						if( match.chunk ) res.push('this.chunk(function (){'); // open new chunk
						if( match.type != 'close' ) res.push('__buf.push(\''); // open push
					} else {
						res.push('\','+ this._var(entry) +',\'');
					}

					txt = txt.substr(entryRight + rightLen);
				}

				if( txt.length ){
					res.push(txt);
				}

				//console.log('js ->', res);
				callback(res.join('') + '\'); });');
			}.bind(this));
		}
	};

	// @static
	Compiler.require = function (filename, callback){
		require('fs').readFile(filename, callback);
	};
	Compiler.compile = function (source){
//		return	new Function ('data, __buf', 'with(data){'+source+'}');
		return	new Function ('__ctx, __buf', source);
	};



	Compiler.rules = {
		// FOREACH
		'foreach\\s+(:var)\\s+as\\s+(:var)(?:\\s*=>\\s*(:var))?': function (input, key, val){
			if( val ){
				val = [val, key];
			} else {
				val	= [key];
				key = false;
			}
//			return { chunk: false, expr: this._var(input, '[]')+'.forEach(function ('+val.join(',')+'){' };
			return { chunk: false, expr: '__ctx.each('+this._var(input)+',"'+val.join('","')+'",function(__ctx){' };
		},
		'/foreach': function (){ return { chunk: false, expr: '}, this);' } },

		// if( ) ... else if( ) ... else
		'(else\\s+)?if(.+)': function (els, expr){ return (els ? '} else' : '')+' if('+this._var(expr)+'){ ' },
		'else$': function (){ return '} else {' },
		'/if': function (){ return '}'; },

		// js code
		'(/)?js': function (close){ return { type: !close ? 'close' : 'open' }; },

		// pull
		'pull(Sync)\\s+(:var)': function (sync, name){
			return { chunk: true, expr: 'this.pull'+sync+'('+name+',function(__ctx){ ' };
		},
		'/pull': function (){ return { chunk: true, expr: '});' } },

		// closure
		'closure\\s+([^\\)]+)\\s*=>\\s*([^\\)]+)': function (a, b){
			return { chunk: true, expr: 'this.closure('+this._var(a)+',function(__ctx){' };
		},
		'/closure': function (){ return { chunk: true, expr: '});' } }
	};


	// @export
	module.exports = Compiler;
})(require('./utils'), require('./Syntax'));
