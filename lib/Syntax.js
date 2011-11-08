(function (){
	'use strict';

	var
		  _rvar = /[a-z$_]/i
		, _rnum = /\d/
		, _invert = { '[': ']', '(': ')' }
		, _keywords = ' break else new var case finally return void catch for switch while continue function this with default if throw delete in try do instanceof typeof null true false '
	;

	function _scan(input, br){
		var res = '';

		while( input.length ){
			var ch = input[0];

			if( ch == br ){
				input.shift();
				break;
			}

			if( _rvar.test(ch) ) {
				res	+= _scanVar(input, true);
			} else if( _rnum.test(ch) ) {
				res += _getByFn(input, function (ch){ return ch == '.' || _rnum.test(ch); });
			} else if( ch == "'" || ch == '"' ){
				ch = _getStr(input);
				if( input[0] == '.' ){
					res	+= ch + _getByFn(input, function (ch){ return ch != '('; });
				} else {
					res	+= ch;
				}
			} else {
				res += ch;
				input.shift();
			}
		}

		return	res;
	}



	function _scanVar(input, prefix){
		var res = [], b = '', ch;

		while( input.length ){
			ch = input[0];

			if( _rvar.test(ch) ){
				b += ch;
			} else if( ch == '.' ){
				if( b ) res.push('get("'+b+'")');
				b = '';
			} else if( ch == '[' || ch == '(' ){
				b = ch == '(' ? 'mod("'+b+'"' : (b ? 'get("'+b+'").get(' : 'get(');
				input.shift();
				var x = _scan(input, _invert[ch]);
				b += (x && ch == '(' ? ','+x : x);
				res.push(b+')');
				b = '';
				continue;
			} else {
				break;
			}

			input.shift();
		}

		if( b ){
			if( _isKW(b) ) return b;
			res.push('get("'+b+'")');
		}

		return	(prefix ? '__ctx.' : '')+res.join('.')+'.val()';
	}


	function _scanVar(input, prefix){
		var res = [], b = '', ch;

		while( input.length ){
			ch = input[0];

			if( _rvar.test(ch) ){
				b += ch;
			} else if( ch == '.' ){
				if( b ) res.push('get("'+b+'")');
				b = '';
			} else if( ch == '[' || ch == '(' ){
				b = ch == '(' ? 'mod("'+b+'"' : (b ? 'get("'+b+'").get(' : 'get(');
				input.shift();
				var x = _scan(input, _invert[ch]);
				b += (x && ch == '(' ? ','+x : x);
				res.push(b+')');
				b = '';
				continue;
			} else {
				break;
			}

			input.shift();
		}

		if( b ){
			if( _isKW(b) ) return b;
			res.push('get("'+b+'")');
		}

		return	(prefix ? '__ctx.' : '')+res.join('.')+'.val()';
	}


	function _scanVar2(input, prefix){
		var res = [], b = '', ch;

		while( input.length ){
			ch = input[0];

			if( _rvar.test(ch) ){
				b += ch;
			} else if( ch == '.' ){
				if( b ) res.push('"'+b+'"');
				b = '';
			} else if( ch == '[' || ch == '(' ){
				b = ch == '(' ? 'mod("'+b+'"' : (b ? '"'+b+'",' : '');
				input.shift();
				var x = _scan(input, _invert[ch]);
				b += (x && ch == '(' ? ','+x : x);
				res.push(b+')');
				b = '';
				continue;
			} else {
				break;
			}

			input.shift();
		}

		if( b ){
			if( _isKW(b) ) return b;
			res.push('"'+b+'"');
		}

		return	(prefix ? '__ctx.getVal([' : '') + res.join(',')+'])';
	}


	function _getStr(input){
		var ch = input.shift(), str = ch, slash = 0;

		while( input.length ){
			var _ch = input[0];
			str += _ch;

			if( _ch == '\\' ){
				slash++;
			} else {
				if( _ch == ch && !(slash % 2) ){
					input.shift();
					return	str;
				}
				slash = 0;
			}

			input.shift();
		}
	}


	function _getByFn(input, fn){
		var str = '', ch;
		while( input.length ){
			ch	= input[0];
			if( fn(ch, str) ){
				str += ch;
			} else {
				break;
			}
			input.shift();
		}
		return	str;
	}


	function _isKW(str){
		return	~_keywords.indexOf(' '+str+' ');
	}


	// @public
	var Syntax = {
		safe: function (input){
			return	_scan(input.split(''));
		}
	};


	//var str = '10 + name == M.DatUTS + "xxx".toStr(test)';
//	var str = '10 + name == M.DatUTS + "xxx" + message.Subject.toUpperCase()';
//	console.log(str);
//	console.log(Syntax.safe(str));


	// @export
	if( typeof __build !== 'undefined' )
		__build.add('./Syntax', Syntax);
	else
		module.exports = Syntax;
})();
