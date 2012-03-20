/*global require, __export*/

(function (utils, undef){
	'use strict';

	function Compiler(opts){
		this._opts	= opts || { useWith: false };
	}

	Compiler.prototype = {
		constructor: Compiler,

		compile: function (input){
			var source = ['','',''], chunk = [], val, node, vars = ['undef','undefined'];

			while( node = input.shift() ){
				if( node.type && node.type == node.VAR_NODE ){
					if( !~utils.indexOf(vars, node.name) )
						vars.push(node.name);
				}
				else if( node.__break ){
					_flush();
					source.push( node.value );
				} else if( node.name == 'value' ){
					if( node.__escape ){
						_flush();
						source.push(' try{__buf.v('+node.value+')}catch(e){} ');
					} else {
						chunk.push( [node.value] );
					}
				} else if( typeof node == 'string' || node.type == node.TEXT_NODE || node.type == node.CDATA_NODE ){
					chunk.push(node.value || node);
				} else {
					_flush();
					source.push( node.value );
				}
			}
			_flush();


			if( this._opts.useWith ){
				source[0]	= "with( ctx ){ ";
				source.push(' } ');
			} else {
				source[0]	= "'use strict';/*global __buf, __this, utils, ctx*/";
			}

			source[1]   = 'var '+vars.join(',');
			source[2]   = ';if(ctx.__part!==undef)__buf.off();';
			source      = source.join('') + ' __buf.end();';

			require('fs').writeFileSync('out.js', source);
//			console.log( source );
//			console.log('------------------');

			return	new Function('ctx, __buf, __utils, __this', source);

			function _flush(){
				var str = '', i = 0, n = chunk.length, prev, type;
				if( n ){
					for( ; i < n; i++ ){
						type = typeof chunk[i];

						if( prev != type || type != 'string' ){
							if( prev ){
								str += prev == 'string' ? "'," : ",";
							}
							str += type == 'string' ? "'" : '';
						}

						str += type == 'string' ? utils.addslashes(chunk[i]) : chunk[i][0];
						prev = type;
					}
					if( type == 'string' ) str += "'";
					source.push('__buf.w('+str.replace(/\r/g, '').replace(/\n/g, '\\n')+');');
					chunk	= [];
				}
			}
		}

	};

	// @export
	if( typeof __export !== 'undefined' )
		__export('./Compiler', Compiler);
	else
		module.exports = Compiler;
})(require('./utils'));
