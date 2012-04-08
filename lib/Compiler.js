/*global require, __export*/

(function (utils, undef){
	'use strict';

	function Compiler(opts){
		this._opts	= opts || { useWith: false };
	}

	Compiler.prototype = {
		constructor: Compiler,

		compile: function (input){
			var
				  source = []
				, chunk = []
				, val
				, node
				, name
				, type
				, vars = 'undef undefined __this=this __XIF __XVAL __XFOR __XATTR __XTAG'.split(' ')
				, before = ''
			;

			while( node = input.shift() ){
				name	= node.name;
				type	= node.type;

				if( type && type == node.VAR_NODE ){
					if( !~utils.indexOf(vars, name) )
						vars.push(name);
				}
				else if( node.__break ){
					_flush();
					source.push( node.value );
				} else if( name == 'value' || name == 'val' ){
					_flush();
					val = ' try{__buf.v('+node.value;
//					if( node.attrAny('mode output') ) val += ',"'+node.attrAny('mode output')+'"';
					source.push(val+')}catch(e){} ');
				} else if( typeof node == 'string' || type == node.TEXT_NODE || type == node.CDATA_NODE ){
					chunk.push(node.value || node);
				} else {
					_flush();
					source.push( node.value );
				}
			}
			_flush();


			if( this._opts.useWith ){
				before	= "with( ctx ){ ";
				source.push(' } ');
			} else {
				before	= "'use strict';/*global ctx, __buf, utils*/";
			}

			before	+= 'var '+vars.join(',')+'';
			source	= ';if(ctx.__part!==undef)__buf.off();' + source.join('') + ' __buf.end();';
			source	= before + source;

//			require('fs').writeFileSync('out.js', source);
//			console.log( source );
//			console.log('------------------');

			return	new Function('ctx, __buf, __utils', source);

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
