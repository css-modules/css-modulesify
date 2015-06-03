var Tokenizer = require('css-selector-tokenizer');

module.exports = function (basename, hash, rule) {
  var selector = Tokenizer.parse(rule.selector);
  selector.nodes = prefixNodes(basename, hash, selector.nodes);
  return Tokenizer.stringify(selector);
};

function prefixNodes (basename, hash, nodes) {
  return nodes
    .map(function(node, i) {
      var newNode = node;

      if (node.type === 'class') {
        newNode.name = basename + '__' + node.name + '___' + hash;
      } else if (newNode.nodes) {
        newNode.nodes = prefixNodes(basename, hash, newNode.nodes);
      }

      return newNode;
    });
}
