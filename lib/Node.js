(function (){
	var _rns = /(\w+):(\w+)/, TYPE = {
		  ELEMENT_NODE: 1
		, ATTRIBUTE_NODE: 2
		, TEXT_NODE: 3
		, CDATA_NODE: 4
		, COMMENT_NODE: 8
		, CUSTOM_NODE: 20
		, COMPILER_NODE: 21
	};

	function Node(name, type, val, attrs){
		if( !(this instanceof Node) ){
			return	new Node(name, type, val, attrs);
		}

		if( typeof name === 'number' ){
			attrs	= val;
			val		= type;
			type	= name;
			
			switch( type ){
				case Node.TEXT_NODE: name = '<text>'; break;
				case Node.CDATA_NODE: name = '<cdata>'; break;
				case Node.COMMENT_NODE: name = '<comment>'; break;
				case Node.CUSTOM_NODE: name = '<custom>'; break;
			}
			this.name	= name;
		} else {
			name	= name.toLowerCase();
			if( name.match(_rns) ){
				this.ns	= RegExp.$1;
				name = RegExp.$2;
			}
			this.name	= name;
		}
		
		this.type		= type;
		this.value		= val;
		this.attributes	= attrs || [];
		this.childNodes	= [];
	}

	
	Node.prototype = {
		constructor: Node,

		replace: function (node){
			this.name	= node.name;
			this.type	= node.type;
			this.value	= node.value;
			this.attributes	= node.attributes;
			return	this;
		},

		addTextNode: function (value){
			return	this.addChild(Node.TEXT_NODE, value);
		},

		addChild: function (node, type, val, attrs){
			if( !(node instanceof Node) ){
				node	= Node(node, type, val, attrs);
			}
			this.childNodes.push(node);
			return	this;
		},

		addChilds: function (list){
			this.childNodes.push.apply(this.childNodes, list); 
			return	this;
		},

		hasChildNodes: function (){
			return	!!this.childNodes.length;
		}
	};


	for( var k in TYPE ){
		Node[k] = Node.prototype[k] = TYPE[k];
	}


	// @export
	if( typeof __build !== 'undefined' )
		__build.add('./Node', Node);
	else
		module.exports = Node;
})();