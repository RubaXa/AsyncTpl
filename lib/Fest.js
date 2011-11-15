(function (utils, Tpl, undef){
	'use strict';

	var _rfest	= /^fest:/;

	function Fest(filename, opts){
		utils.inherit(this, Tpl, '__lego', [filename, opts]);
	}

	utils.inherit(Fest, Tpl);


	Fest.prototype._trans = function(node, input, cp){
		var attrs = node.attributes;

		if( node.ns != 'fest' ){
			if( node.type == node.ELEMENT_NODE ){
				node.type	= node.TEXT_NODE;
				if( !node.__empty && node.__close ){
					node.value	= '</'+ node.name +'>';
				} else {
					node.addTextNode('<'+node.name);
					utils.each(attrs, function (attr){
						if( _rfest.test(attr.value) ){
							node
								.addTextNode(' '+attr.name+'="')
								.addChild(node.COMPILER_NODE, cp.escape(attr.value.replace(_rfest, '')))
								.addTextNode('"')
							;
						} else {
							node.addTextNode(' '+attr.name+'="'+attr.value+'"');
						}
					});
					node.addTextNode(node.__empty ? '/>' : '>');
				}
			}
		} else {
			switch( node.name ){
				case 'script':
						if( !node.__close ) node.replace(input.shift());
						node.type = node.COMPILER_NODE;
						node.__break = true;
					break;

				case 'if':
						node.type = node.COMPILER_NODE;
						node.value = node.__close ? '}' : 'if(' + cp.safe(attrs.test.value) + '){';
						node.__break = true;
					break;

				case 'cycle':
				case 'foreach':
						node.type = node.COMPILER_NODE;
						node.__break = true;
						if( node.__close ){
							node.value	= '});';
						} else {
							var args	= '';
							if( node.name == 'cycle' ){
								node.value	= '__utils.cycle('+attrs.from.value+', '+attrs['to'].value+', function (){';
							} else {
								if( attrs.as ) args = attrs.as.value;
								if( attrs.index ) args += (args == '' ? '__i,' : ',') + attrs.index.value;
								node.value	= '__utils.each('+cp.safe(attrs.iterate.value)+', function ('+args+'){';
							}
						}
					break;

				case 'value':
						node.replace(input.shift());
						node.type	= node.COMPILER_NODE;
						node.value	= cp.escape(node.value);
						input.shift();
					break;

				case 'include':
						node.addChilds(cp.include(attrs.src.value));
					break;

				case 'get':
						node.type 		= node.COMPILER_NODE;
						if( this._opts.stream || this.blockLevel ){
							if( node.__empty ){
								node.value	=  '__this.getBlock("'+attrs.name.value+'")';
							} else {
								node.value	=  node.__close ? '})' : '__this.getBlock("'+attrs.name.value+'", function (__ondata){';
							}
						} else {
							if( node.__empty ){
								node.value	=  '__ondata(__this.blockLabel, "'+attrs.name.value+'");';
							} else {
								node.value	=  node.__close ? '});' : '__ondata(__this.blockLabel, "'+attrs.name.value+'", function (__ondata){';
							}
							node.__break	= true;
						}
					break;

				case 'set':
						this.blockLevel	= (this.blockLevel>>0) + (node.__close ? -1 : 1); 
						node.type 		= node.COMPILER_NODE;
						node.value		= node.__close ? '});' : '__this.setBlock("'+attrs.name.value+'",function(__ondata){';
						node.__break	= true;
					break;

				default:
						node.type	= node.TEXT_NODE;
					break;
			}
		}
	};


	// @export
	if( typeof __build !== 'undefined' )
		__build.add('./Fest', Fest);
	else
		module.exports = Fest;
})(require('./utils'), require('./Template'));
