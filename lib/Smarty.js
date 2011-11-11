(function (utils, Tpl){
	'use strict';

	var tags = 'foreach';


	function Smarty(filename, opts){
		opts = opts || {};
		opts.tags = tags;

		utils.inherit(this, Tpl, '__lego', [filename, opts]);

		this._compiler.transformer(_transformer);
	}

	Smarty.LEFT		= '{{';
	Smarty.RIGHT	= '}}';
	Smarty.TRIM		= true;

	utils.inherit(Smarty, Tpl);
	utils.extend(Smarty.prototype, {
		self:	Smarty,

		_trans: function(node, input, cp){
			var attrs = node.attributes;

			if( node.type == node.ELEMENT_NODE || node.type == node.CUSTOM_NODE ) switch( node.name ){
				case 'js':
						if( !node.__close ) node.replace(input.shift());
						node.type = node.COMPILER_NODE;
						node.__break = true;
					break;

				case 'if':
						node.type = node.COMPILER_NODE;
						node.value = node.__close ? '}' : 'if(' + cp.safe(node.value) + '){';
						node.__break = true;
					break;

				case 'foreach':
						node.type = node.COMPILER_NODE;
						node.__break = true;
						if( node.__close ){
							node.value	= '});';
						} else {
							var args	= '';
							if( attrs.item ) args = attrs.item.value;
							if( attrs.key ) args += (args == '' ? '__i,' : ',') + attrs.key.value;
							node.value	= '__utils.each('+cp.safe(attrs.from.value)+', function ('+args+'){';
						}
					break;

				default:
						node.type = node.COMPILER_NODE;
						node.value = cp.escape(node.name + node.value);
					break;
			}
		}
	});
	


	// @export
	if( typeof __build !== 'undefined' )
		__build.add('./Smarty', Smarty);
	else
		module.exports = Smarty;
})(require('./utils'), require('./Template'));
