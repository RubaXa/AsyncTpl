(function (utils, undef){
	'use strict';

	function Compiler(opts){
		this._opts	= opts || { useWith: false }; 
	}

	Compiler.prototype = {
		constructor: Compiler,

		compile: function (input){
			var source = [''], chunk = [], val, node;

			while( node = input.shift() ){
				if( node.__break ){
					_flush();
					source.push( node.value );
				}
				else if( node.name == 'value' ){
					chunk.push( [node.value] );
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
				source[0]	= "'use strict';";
			}

//			console.log( source.join('') );
//			console.log('------------------');
			
			return	new Function('ctx, __this, __ondata, __utils', source.join('') + ' __ondata();');

			
			function _flush(){
				var str = '', i = 0, n = chunk.length, prev, type;
				if( n ){
					for( ; i < n; i++ ){
						type	= typeof chunk[i];
						if( type != prev || type != 'string' ){
							if( prev ){
								if( prev == 'string' ) str += "'";
								str += ', ';
								if( type == 'string' ) str += "'";
							}
							else if( type == 'string' ) str += "'";
							//str += (prev == 'string' || type == 'string' ? "'" : '');
						}

						str += type == 'string' ? utils.addslashes(chunk[i]) : chunk[i][0];
						prev	= type;
					}
					if( type == 'string' ) str += "'";
					source.push('__ondata('+str.replace(/\r/g, '').replace(/\n/g, '\\n')+');');
					chunk	= [];
				}
			}
		}

	};

	// @export
	if( typeof __build !== 'undefined' )
		__build.add('./Compiler', Compiler);
	else
		module.exports = Compiler;
})(require('./utils'));
