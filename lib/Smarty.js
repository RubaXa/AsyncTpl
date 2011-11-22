(function (utils, undef){
	'use strict';

	var tags = 'foreach include';

	var Smarty = {
		_defaults: function (opts){
			return this.parent(utils.extend({ left: '{{', right: '}}', c_open: '{{*', c_close: '*}}' }, opts, { tags: tags }));
		},

		_trans: function (node, input){
			var res = [], val, attrs = node.attributes;

			if( node.type == node.ELEMENT_NODE || node.type == node.CUSTOM_NODE ) switch( node.name ){
				case 'script': val = ' try{ '+input.shift().value+' } catch (er){} '; input.shift(); break;

				case 'if': val = node.__close ? '}' : 'if(' + this.safe(attrs) + '){'; break;

				case 'else': val = '}'+ node.name +'{'; break;
				case 'elseif': val = '}else if('+ this.safe(attrs) +'){'; break;

				case 'get':
						val	= !node.__empty && node.__close ? '})' : '__this.getBlock("'+attrs.name.value+'"'+ (!node.__empty ? ',function (__ondata){' : ')');
					break;

				case 'set':
						val	= node.__close ? '});' : '__this.setBlock("'+attrs.name.value+'",function(__ondata){';
					break;

				case 'include':
						val	= attrs.file.value;
					break;

				case 'foreach':
						if( node.__close ){
							val	= '});';
						} else {
							var args	= '';
							if( attrs.item ) args = attrs.item.value;
							if( attrs.key ) args += (args == '' ? '__i,' : ',') + attrs.key.value;
							val	= '__utils.each('+this.safe(attrs.from.value)+', function ('+args+'){';
						}
					break;

				default:
						val	= this.escape(node.name + attrs);
						node.name = 'value';
					break;
			}

			if( val !== undef ){
				node.value	= val;
			}

			return	res.length  ? res : node;
		},

		safe: function (expr){
			expr = expr.replace(/\$([a-z][a-z0-9_]*)/ig, function (a, b){
				return '(typeof '+b+'==="undefined"?ctx.'+b+':'+b+')';
			});
			return	this.parent(expr);
		}
	};

	// @export
	if( typeof __build !== 'undefined' )
		__build.add('./Smarty', Smarty);
	else
		module.exports = Smarty;
})(require('./utils'));
