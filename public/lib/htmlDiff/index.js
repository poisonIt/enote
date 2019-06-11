(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('lodash')) :
  typeof define === 'function' && define.amd ? define(['exports', 'lodash'], factory) :
  (global = global || self, factory(global.bundle = {}, global._));
}(this, function (exports, _) { 'use strict';

  // from html-parse-stringify (MIT)

  const DEFAULT_OPTIONS = {
      debug: false,
      diffcap: 10, // Limit for how many diffs are accepting when debugging. Inactive when debug is false.
      maxDepth: false, // False or a numeral. If set to a numeral, limits the level of depth that the the diff mechanism looks for differences. If false, goes through the entire tree.
      maxChildCount: 50, // False or a numeral. If set to a numeral, only does a simplified form of diffing of contents so that the number of diffs cannot be higher than the number of child nodes.
      valueDiffing: true, // Whether to take into consideration the values of forms that differ from auto assigned values (when a user fills out a form).
      // syntax: textDiff: function (node, currentValue, expectedValue, newValue)
      textDiff(node, currentValue, expectedValue, newValue) {
          node.data = newValue;
          return
      },
      // empty functions were benchmarked as running faster than both
      // `f && f()` and `if (f) { f(); }`
      preVirtualDiffApply() {},
      postVirtualDiffApply() {},
      preDiffApply() {},
      postDiffApply() {},
      filterOuterDiff: null,
      compress: false, // Whether to work with compressed diffs
      _const: false, // object with strings for every change types to be used in diffs.
      document: window && window.document ? window.document : false
  };

  /**
   * Use TraceLogger to figure out function calls inside
   * JS objects by wrapping an object with a TraceLogger
   * instance.
   *
   * Pretty-prints the call trace (using unicode box code)
   * when tracelogger.toString() is called.
   */

  function objToNode(objNode, insideSvg, options) {
      let node;
      if (objNode.nodeName === '#text') {
          node = options.document.createTextNode(objNode.data);

      } else if (objNode.nodeName === '#comment') {
          node = options.document.createComment(objNode.data);
      } else {
          if (objNode.nodeName === 'svg' || insideSvg) {
              node = options.document.createElementNS('http://www.w3.org/2000/svg', objNode.nodeName);
              insideSvg = true;
          } else {
              node = options.document.createElement(objNode.nodeName);
          }
          if (objNode.attributes) {
              Object.entries(objNode.attributes).forEach(([key, value]) => node.setAttribute(key, value));
          }
          if (objNode.childNodes) {
              objNode.childNodes.forEach(childNode => node.appendChild(objToNode(childNode, insideSvg, options)));
          }
          if (options.valueDiffing) {
              if (objNode.value) {
                  node.value = objNode.value;
              }
              if (objNode.checked) {
                  node.checked = objNode.checked;
              }
              if (objNode.selected) {
                  node.selected = objNode.selected;
              }
          }
      }
      return node
  }

  // ===== Apply a diff =====

  function getFromRoute(node, route) {
      route = route.slice();
      while (route.length > 0) {
          if (!node.childNodes) {
              return false
          }
          const c = route.splice(0, 1)[0];
          node = node.childNodes[c];
      }
      return node
  }

  function applyDiff(
          tree,
          diff,
          options // {preDiffApply, postDiffApply, textDiff, valueDiffing, _const}
      ) {
      let node = getFromRoute(tree, diff[options._const.route]);
      let newNode;
      let reference;
      let route;
      let nodeArray;
      let c;

      // pre-diff hook
      const info = {
          diff,
          node
      };

      if (options.preDiffApply(info)) {
          return true
      }

      switch (diff[options._const.action]) {
          case options._const.addAttribute:
              if (!node || !node.setAttribute) {
                  return false
              }
              node.setAttribute(diff[options._const.name], diff[options._const.value]);
              break
          case options._const.modifyAttribute:
              if (!node || !node.setAttribute) {
                  return false
              }
              node.setAttribute(diff[options._const.name], diff[options._const.newValue]);
              if (node.nodeName === 'INPUT' && diff[options._const.name] === 'value') {
                  node.value = diff[options._const.newValue];
              }
              break
          case options._const.removeAttribute:
              if (!node || !node.removeAttribute) {
                  return false
              }
              node.removeAttribute(diff[options._const.name]);
              break
          case options._const.modifyTextElement:
              if (!node || node.nodeType !== 3) {
                  return false
              }
              options.textDiff(node, node.data, diff[options._const.oldValue], diff[options._const.newValue]);
              break
          case options._const.modifyValue:
              if (!node || typeof node.value === 'undefined') {
                  return false
              }
              node.value = diff[options._const.newValue];
              break
          case options._const.modifyComment:
              if (!node || typeof node.data === 'undefined') {
                  return false
              }
              options.textDiff(node, node.data, diff[options._const.oldValue], diff[options._const.newValue]);
              break
          case options._const.modifyChecked:
              if (!node || typeof node.checked === 'undefined') {
                  return false
              }
              node.checked = diff[options._const.newValue];
              break
          case options._const.modifySelected:
              if (!node || typeof node.selected === 'undefined') {
                  return false
              }
              node.selected = diff[options._const.newValue];
              break
          case options._const.replaceElement:
              node.parentNode.replaceChild(
                  objToNode(
                      diff[options._const.newValue],
                      node.namespaceURI === 'http://www.w3.org/2000/svg',
                      options
                  ),
                  node
              );
              break
          case options._const.relocateGroup:
              nodeArray = Array(...new Array(diff.groupLength)).map(() => node.removeChild(node.childNodes[diff[options._const.from]]));
              nodeArray.forEach((childNode, index) => {
                  if (index === 0) {
                      reference = node.childNodes[diff[options._const.to]];
                  }
                  node.insertBefore(childNode, reference || null);
              });
              break
          case options._const.removeElement:
              node.parentNode.removeChild(node);
              break
          case options._const.addElement:
              route = diff[options._const.route].slice();
              c = route.splice(route.length - 1, 1)[0];
              node = getFromRoute(tree, route);
              node.insertBefore(
                  objToNode(
                      diff[options._const.element],
                      node.namespaceURI === 'http://www.w3.org/2000/svg',
                      options
                  ),
                  node.childNodes[c] || null
              );
              break
          case options._const.removeTextElement:
              if (!node || node.nodeType !== 3) {
                  return false
              }
              node.parentNode.removeChild(node);
              break
          case options._const.addTextElement:
              route = diff[options._const.route].slice();
              c = route.splice(route.length - 1, 1)[0];
              newNode = options.document.createTextNode(diff[options._const.value]);
              node = getFromRoute(tree, route);
              if (!node || !node.childNodes) {
                  return false
              }
              node.insertBefore(newNode, node.childNodes[c] || null);
              break
          default:
              console.log('unknown action');
      }

      // if a new node was created, we might be interested in its
      // post diff hook
      info.newNode = newNode;
      options.postDiffApply(info);

      return true
  }

  function applyDOM(tree, diffs, options) {
      return diffs.every(diff => applyDiff(tree, diff, options))
  }

  // ===== Undo a diff =====

  function swap(obj, p1, p2) {
      const tmp = obj[p1];
      obj[p1] = obj[p2];
      obj[p2] = tmp;
  }

  function undoDiff(
      tree,
      diff,
      options // {preDiffApply, postDiffApply, textDiff, valueDiffing, _const}
  ) {

      switch (diff[options._const.action]) {
          case options._const.addAttribute:
              diff[options._const.action] = options._const.removeAttribute;
              applyDiff(tree, diff, options);
              break
          case options._const.modifyAttribute:
              swap(diff, options._const.oldValue, options._const.newValue);
              applyDiff(tree, diff, options);
              break
          case options._const.removeAttribute:
              diff[options._const.action] = options._const.addAttribute;
              applyDiff(tree, diff, options);
              break
          case options._const.modifyTextElement:
              swap(diff, options._const.oldValue, options._const.newValue);
              applyDiff(tree, diff, options);
              break
          case options._const.modifyValue:
              swap(diff, options._const.oldValue, options._const.newValue);
              applyDiff(tree, diff, options);
              break
          case options._const.modifyComment:
              swap(diff, options._const.oldValue, options._const.newValue);
              applyDiff(tree, diff, options);
              break
          case options._const.modifyChecked:
              swap(diff, options._const.oldValue, options._const.newValue);
              applyDiff(tree, diff, options);
              break
          case options._const.modifySelected:
              swap(diff, options._const.oldValue, options._const.newValue);
              applyDiff(tree, diff, options);
              break
          case options._const.replaceElement:
              swap(diff, options._const.oldValue, options._const.newValue);
              applyDiff(tree, diff, options);
              break
          case options._const.relocateGroup:
              swap(diff, options._const.from, options._const.to);
              applyDiff(tree, diff, options);
              break
          case options._const.removeElement:
              diff[options._const.action] = options._const.addElement;
              applyDiff(tree, diff, options);
              break
          case options._const.addElement:
              diff[options._const.action] = options._const.removeElement;
              applyDiff(tree, diff, options);
              break
          case options._const.removeTextElement:
              diff[options._const.action] = options._const.addTextElement;
              applyDiff(tree, diff, options);
              break
          case options._const.addTextElement:
              diff[options._const.action] = options._const.removeTextElement;
              applyDiff(tree, diff, options);
              break
          default:
              console.log('unknown action');
      }

  }

  function undoDOM(tree, diffs, options) {
      if (!diffs.length) {
          diffs = [diffs];
      }
      diffs = diffs.slice();
      diffs.reverse();
      diffs.forEach(diff => {
          undoDiff(tree, diff, options);
      });
  }

  class Diff {
    constructor(options = {}) {
      Object.entries(options).forEach(([key, value]) => this[key] = value);
    }

    toString() {
      return JSON.stringify(this)
    }

    setValue(aKey, aValue) {
      this[aKey] = aValue;
      return this
    }
  }

  function elementDescriptors(el) {
    const output = [];
    if (el.nodeName !== '#text' && el.nodeName !== '#comment') {
      output.push(el.nodeName);
      if (el.attributes) {
        if (el.attributes['class']) {
          output.push(`${el.nodeName}.${el.attributes['class'].replace(/ /g, '.')}`);
        }
        if (el.attributes.id) {
          output.push(`${el.nodeName}#${el.attributes.id}`);
        }
      }

    }
    return output
  }

  function findUniqueDescriptors(li) {
    const uniqueDescriptors = {};
    const duplicateDescriptors = {};

    li.forEach(node => {
      elementDescriptors(node).forEach(descriptor => {
        const inUnique = descriptor in uniqueDescriptors;
        const inDupes = descriptor in duplicateDescriptors;
        if (!inUnique && !inDupes) {
          uniqueDescriptors[descriptor] = true;
        } else if (inUnique) {
          delete uniqueDescriptors[descriptor];
          duplicateDescriptors[descriptor] = true;
        }
      });
    });

    return uniqueDescriptors
  }

  function uniqueInBoth(l1, l2) {
    const l1Unique = findUniqueDescriptors(l1);
    const l2Unique = findUniqueDescriptors(l2);
    const inBoth = {};

    Object.keys(l1Unique).forEach(key => {
      if (l2Unique[key]) {
        inBoth[key] = true;
      }
    });

    return inBoth
  }

  function removeDone(tree) {
    delete tree.outerDone;
    delete tree.innerDone;
    delete tree.valueDone;
    if (tree.childNodes) {
      return tree.childNodes.every(removeDone)
    } else {
      return true
    }
  }

  function isEqual(e1, e2) {
    if (!['nodeName', 'value', 'checked', 'selected', 'data'].every(element => {
        if (e1[element] !== e2[element]) {
          return false
        }
        return true
      })) {
      return false
    }

    if (Boolean(e1.attributes) !== Boolean(e2.attributes)) {
      return false
    }

    if (Boolean(e1.childNodes) !== Boolean(e2.childNodes)) {
      return false
    }
    if (e1.attributes) {
      const e1Attributes = Object.keys(e1.attributes);
      const e2Attributes = Object.keys(e2.attributes);

      if (e1Attributes.length !== e2Attributes.length) {
        return false
      }
      if (!e1Attributes.every(attribute => {
          if (e1.attributes[attribute] !== e2.attributes[attribute]) {
            return false
          }
          return true
        })) {
        return false
      }
    }
    if (e1.childNodes) {
      if (e1.childNodes.length !== e2.childNodes.length) {
        return false
      }
      if (!e1.childNodes.every((childNode, index) => isEqual(childNode, e2.childNodes[index]))) {

        return false
      }

    }

    return true
  }


  function roughlyEqual(e1, e2, uniqueDescriptors, sameSiblings, preventRecursion) {

    if (!e1 || !e2) {
      return false
    }

    if (e1.nodeName !== e2.nodeName) {
      return false
    }

    if (e1.nodeName === '#text') {
      // Note that we initially don't care what the text content of a node is,
      // the mere fact that it's the same tag and "has text" means it's roughly
      // equal, and then we can find out the true text difference later.
      return preventRecursion ? true : e1.data === e2.data
    }


    if (e1.nodeName in uniqueDescriptors) {
      return true
    }

    if (e1.attributes && e2.attributes) {

      if (e1.attributes.id) {
        if (e1.attributes.id !== e2.attributes.id) {
          return false
        } else {
          const idDescriptor = `${e1.nodeName}#${e1.attributes.id}`;
          if (idDescriptor in uniqueDescriptors) {
            return true
          }
        }
      }
      if (e1.attributes['class'] && e1.attributes['class'] === e2.attributes['class']) {
        const classDescriptor = `${e1.nodeName}.${e1.attributes['class'].replace(/ /g, '.')}`;
        if (classDescriptor in uniqueDescriptors) {
          return true
        }
      }
    }

    if (sameSiblings) {
      return true
    }

    const nodeList1 = e1.childNodes ? e1.childNodes.slice().reverse() : [];
    const nodeList2 = e2.childNodes ? e2.childNodes.slice().reverse() : [];

    if (nodeList1.length !== nodeList2.length) {
      return false
    }

    if (preventRecursion) {
      return nodeList1.every((element, index) => element.nodeName === nodeList2[index].nodeName)
    } else {
      // note: we only allow one level of recursion at any depth. If 'preventRecursion'
      // was not set, we must explicitly force it to true for child iterations.
      const childUniqueDescriptors = uniqueInBoth(nodeList1, nodeList2);
      return nodeList1.every((element, index) => roughlyEqual(element, nodeList2[index], childUniqueDescriptors, true, true))
    }
  }


  function cloneObj(obj) { //  TODO: Do we really need to clone here? Is it not enough to just return the original object?
    return JSON.parse(JSON.stringify(obj))
  }
  /**
   * based on https://en.wikibooks.org/wiki/Algorithm_implementation/Strings/Longest_common_substring#JavaScript
   */
  function findCommonSubsets(c1, c2, marked1, marked2) {
    let lcsSize = 0;
    let index = [];
    const c1Length = c1.length;
    const c2Length = c2.length;

    const // set up the matching table
      matches = Array(...new Array(c1Length + 1)).map(() => []);

    const uniqueDescriptors = uniqueInBoth(c1, c2);

    let // If all of the elements are the same tag, id and class, then we can
      // consider them roughly the same even if they have a different number of
      // children. This will reduce removing and re-adding similar elements.
      subsetsSame = c1Length === c2Length;

    if (subsetsSame) {

      c1.some((element, i) => {
        const c1Desc = elementDescriptors(element);
        const c2Desc = elementDescriptors(c2[i]);
        if (c1Desc.length !== c2Desc.length) {
          subsetsSame = false;
          return true
        }
        c1Desc.some((description, i) => {
          if (description !== c2Desc[i]) {
            subsetsSame = false;
            return true
          }
        });
        if (!subsetsSame) {
          return true
        }
      });
    }

    // fill the matches with distance values
    for (let c1Index = 0; c1Index < c1Length; c1Index++) {
      const c1Element = c1[c1Index];
      for (let c2Index = 0; c2Index < c2Length; c2Index++) {
        const c2Element = c2[c2Index];
        if (!marked1[c1Index] && !marked2[c2Index] && roughlyEqual(c1Element, c2Element, uniqueDescriptors, subsetsSame)) {
          matches[c1Index + 1][c2Index + 1] = (matches[c1Index][c2Index] ? matches[c1Index][c2Index] + 1 : 1);
          if (matches[c1Index + 1][c2Index + 1] >= lcsSize) {
            lcsSize = matches[c1Index + 1][c2Index + 1];
            index = [c1Index + 1, c2Index + 1];
          }
        } else {
          matches[c1Index + 1][c2Index + 1] = 0;
        }
      }
    }

    if (lcsSize === 0) {
      return false
    }

    return {
      oldValue: index[0] - lcsSize,
      newValue: index[1] - lcsSize,
      length: lcsSize
    }
  }

  /**
   * This should really be a predefined function in Array...
   */
  function makeArray(n, v) {
    return Array(...new Array(n)).map(() => v)
  }

  /**
   * Generate arrays that indicate which node belongs to which subset,
   * or whether it's actually an orphan node, existing in only one
   * of the two trees, rather than somewhere in both.
   *
   * So if t1 = <img><canvas><br>, t2 = <canvas><br><img>.
   * The longest subset is "<canvas><br>" (length 2), so it will group 0.
   * The second longest is "<img>" (length 1), so it will be group 1.
   * gaps1 will therefore be [1,0,0] and gaps2 [0,0,1].
   *
   * If an element is not part of any group, it will stay being 'true', which
   * is the initial value. For example:
   * t1 = <img><p></p><br><canvas>, t2 = <b></b><br><canvas><img>
   *
   * The "<p></p>" and "<b></b>" do only show up in one of the two and will
   * therefore be marked by "true". The remaining parts are parts of the
   * groups 0 and 1:
   * gaps1 = [1, true, 0, 0], gaps2 = [true, 0, 0, 1]
   *
   */
  function getGapInformation(t1, t2, stable) {
    const gaps1 = t1.childNodes ? makeArray(t1.childNodes.length, true) : [];
    const gaps2 = t2.childNodes ? makeArray(t2.childNodes.length, true) : [];
    let group = 0;

    // give elements from the same subset the same group number
    stable.forEach(subset => {
      const endOld = subset.oldValue + subset.length;
      const endNew = subset.newValue + subset.length;

      for (let j = subset.oldValue; j < endOld; j += 1) {
        gaps1[j] = group;
      }
      for (let j = subset.newValue; j < endNew; j += 1) {
        gaps2[j] = group;
      }
      group += 1;
    });

    return {
      gaps1,
      gaps2
    }
  }

  /**
   * Find all matching subsets, based on immediate child differences only.
   */
  function markSubTrees(oldTree, newTree) {
    // note: the child lists are views, and so update as we update old/newTree
    const oldChildren = oldTree.childNodes ? oldTree.childNodes : [];

    const newChildren = newTree.childNodes ? newTree.childNodes : [];
    const marked1 = makeArray(oldChildren.length, false);
    const marked2 = makeArray(newChildren.length, false);
    const subsets = [];
    let subset = true;

    const returnIndex = function () {
      return arguments[1]
    };

    const markBoth = i => {
      marked1[subset.oldValue + i] = true;
      marked2[subset.newValue + i] = true;
    };

    while (subset) {
      subset = findCommonSubsets(oldChildren, newChildren, marked1, marked2);
      if (subset) {
        subsets.push(subset);
        const subsetArray = Array(...new Array(subset.length)).map(returnIndex);
        subsetArray.forEach(item => markBoth(item));
      }
    }

    oldTree.subsets = subsets;
    oldTree.subsetsAge = 100;
    return subsets
  }

  class DiffTracker {
    constructor() {
      this.list = [];
    }

    add(diffs) {
      this.list.push(...diffs);
    }
    forEach(fn) {
      this.list.forEach(li => fn(li));
    }

  }

  // ===== Apply a virtual diff =====

  function getFromVirtualRoute(tree, route) {
    let node = tree;
    let parentNode;
    let nodeIndex;

    route = route.slice();
    while (route.length > 0) {
      if (!node.childNodes) {
        return false
      }
      nodeIndex = route.splice(0, 1)[0];
      parentNode = node;
      node = node.childNodes[nodeIndex];
    }
    return {
      node,
      parentNode,
      nodeIndex
    }
  }

  function applyVirtualDiff(
    tree,
    diff,
    options // {preDiffApply, postDiffApply, _const}
  ) {
    const routeInfo = getFromVirtualRoute(tree, diff[options._const.route]);
    let node = routeInfo.node;
    const parentNode = routeInfo.parentNode;
    const nodeIndex = routeInfo.nodeIndex;
    const newSubsets = [];

    // pre-diff hook
    const info = {
      diff,
      node
    };

    if (options.preDiffApply(info)) {
      return true
    }

    let newNode;
    let nodeArray;
    let route;
    let c;
    switch (diff[options._const.action]) {
      case options._const.addAttribute:
        if (!node.attributes) {
          node.attributes = {};
        }

        node.attributes[diff[options._const.name]] = diff[options._const.value];

        if (diff[options._const.name] === 'checked') {
          node.checked = true;
        } else if (diff[options._const.name] === 'selected') {
          node.selected = true;
        } else if (node.nodeName === 'INPUT' && diff[options._const.name] === 'value') {
          node.value = diff[options._const.value];
        }

        break
      case options._const.modifyAttribute:
        node.attributes[diff[options._const.name]] = diff[options._const.newValue];
        break
      case options._const.removeAttribute:

        delete node.attributes[diff[options._const.name]];

        if (Object.keys(node.attributes).length === 0) {
          delete node.attributes;
        }

        if (diff[options._const.name] === 'checked') {
          node.checked = false;
        } else if (diff[options._const.name] === 'selected') {
          delete node.selected;
        } else if (node.nodeName === 'INPUT' && diff[options._const.name] === 'value') {
          delete node.value;
        }

        break
      case options._const.modifyTextElement:
        node.data = diff[options._const.newValue];
        break
      case options._const.modifyValue:
        node.value = diff[options._const.newValue];
        break
      case options._const.modifyComment:
        node.data = diff[options._const.newValue];
        break
      case options._const.modifyChecked:
        node.checked = diff[options._const.newValue];
        break
      case options._const.modifySelected:
        node.selected = diff[options._const.newValue];
        break
      case options._const.replaceElement:
        newNode = cloneObj(diff[options._const.newValue]);
        newNode.outerDone = true;
        newNode.innerDone = true;
        newNode.valueDone = true;
        parentNode.childNodes[nodeIndex] = newNode;
        break
      case options._const.relocateGroup:
        nodeArray = node.childNodes.splice(diff[options._const.from], diff.groupLength).reverse();
        nodeArray.forEach(movedNode => node.childNodes.splice(diff[options._const.to], 0, movedNode));
        if (node.subsets) {
          node.subsets.forEach(map => {
            if (diff[options._const.from] < diff[options._const.to] && map.oldValue <= diff[options._const.to] && map.oldValue > diff[options._const.from]) {
              map.oldValue -= diff.groupLength;
              const splitLength = map.oldValue + map.length - diff[options._const.to];
              if (splitLength > 0) {
                // new insertion splits map.
                newSubsets.push({
                  oldValue: diff[options._const.to] + diff.groupLength,
                  newValue: map.newValue + map.length - splitLength,
                  length: splitLength
                });
                map.length -= splitLength;
              }
            } else if (diff[options._const.from] > diff[options._const.to] && map.oldValue > diff[options._const.to] && map.oldValue < diff[options._const.from]) {
              map.oldValue += diff.groupLength;
              const splitLength = map.oldValue + map.length - diff[options._const.to];
              if (splitLength > 0) {
                // new insertion splits map.
                newSubsets.push({
                  oldValue: diff[options._const.to] + diff.groupLength,
                  newValue: map.newValue + map.length - splitLength,
                  length: splitLength
                });
                map.length -= splitLength;
              }
            } else if (map.oldValue === diff[options._const.from]) {
              map.oldValue = diff[options._const.to];
            }
          });
        }

        break
      case options._const.removeElement:
        parentNode.childNodes.splice(nodeIndex, 1);
        if (parentNode.subsets) {
          parentNode.subsets.forEach(map => {
            if (map.oldValue > nodeIndex) {
              map.oldValue -= 1;
            } else if (map.oldValue === nodeIndex) {
              map.delete = true;
            } else if (map.oldValue < nodeIndex && (map.oldValue + map.length) > nodeIndex) {
              if (map.oldValue + map.length - 1 === nodeIndex) {
                map.length--;
              } else {
                newSubsets.push({
                  newValue: map.newValue + nodeIndex - map.oldValue,
                  oldValue: nodeIndex,
                  length: map.length - nodeIndex + map.oldValue - 1
                });
                map.length = nodeIndex - map.oldValue;
              }
            }
          });
        }
        node = parentNode;
        break
      case options._const.addElement:
        route = diff[options._const.route].slice();
        c = route.splice(route.length - 1, 1)[0];
        node = getFromVirtualRoute(tree, route).node;
        newNode = cloneObj(diff[options._const.element]);
        newNode.outerDone = true;
        newNode.innerDone = true;
        newNode.valueDone = true;

        if (!node.childNodes) {
          node.childNodes = [];
        }

        if (c >= node.childNodes.length) {
          node.childNodes.push(newNode);
        } else {
          node.childNodes.splice(c, 0, newNode);
        }
        if (node.subsets) {
          node.subsets.forEach(map => {
            if (map.oldValue >= c) {
              map.oldValue += 1;
            } else if (map.oldValue < c && (map.oldValue + map.length) > c) {
              const splitLength = map.oldValue + map.length - c;
              newSubsets.push({
                newValue: map.newValue + map.length - splitLength,
                oldValue: c + 1,
                length: splitLength
              });
              map.length -= splitLength;
            }
          });
        }
        break
      case options._const.removeTextElement:
        parentNode.childNodes.splice(nodeIndex, 1);
        if (parentNode.nodeName === 'TEXTAREA') {
          delete parentNode.value;
        }
        if (parentNode.subsets) {
          parentNode.subsets.forEach(map => {
            if (map.oldValue > nodeIndex) {
              map.oldValue -= 1;
            } else if (map.oldValue === nodeIndex) {
              map.delete = true;
            } else if (map.oldValue < nodeIndex && (map.oldValue + map.length) > nodeIndex) {
              if (map.oldValue + map.length - 1 === nodeIndex) {
                map.length--;
              } else {
                newSubsets.push({
                  newValue: map.newValue + nodeIndex - map.oldValue,
                  oldValue: nodeIndex,
                  length: map.length - nodeIndex + map.oldValue - 1
                });
                map.length = nodeIndex - map.oldValue;
              }
            }
          });
        }
        node = parentNode;
        break
      case options._const.addTextElement:
        route = diff[options._const.route].slice();
        c = route.splice(route.length - 1, 1)[0];
        newNode = {};
        newNode.nodeName = '#text';
        newNode.data = diff[options._const.value];
        node = getFromVirtualRoute(tree, route).node;
        if (!node.childNodes) {
          node.childNodes = [];
        }

        if (c >= node.childNodes.length) {
          node.childNodes.push(newNode);
        } else {
          node.childNodes.splice(c, 0, newNode);
        }
        if (node.nodeName === 'TEXTAREA') {
          node.value = diff[options._const.newValue];
        }
        if (node.subsets) {
          node.subsets.forEach(map => {
            if (map.oldValue >= c) {
              map.oldValue += 1;
            }
            if (map.oldValue < c && (map.oldValue + map.length) > c) {
              const splitLength = map.oldValue + map.length - c;
              newSubsets.push({
                newValue: map.newValue + map.length - splitLength,
                oldValue: c + 1,
                length: splitLength
              });
              map.length -= splitLength;
            }
          });
        }
        break
      default:
        console.log('unknown action');
    }

    if (node.subsets) {
      node.subsets = node.subsets.filter(map => !map.delete && map.oldValue !== map.newValue);
      if (newSubsets.length) {
        node.subsets = node.subsets.concat(newSubsets);
      }
    }

    // capture newNode for the callback
    info.newNode = newNode;
    options.postDiffApply(info);

    return
  }

  function applyVirtual(tree, diffs, options) {
    diffs.forEach(diff => {
      applyVirtualDiff(tree, diff, options);
    });
    return true
  }

  function nodeToObj(aNode, options = {}) {
    const objNode = {};
    objNode.nodeName = aNode.nodeName;
    if (objNode.nodeName === '#text' || objNode.nodeName === '#comment') {
      objNode.data = aNode.data;
    } else {
      if (aNode.attributes && aNode.attributes.length > 0) {
        objNode.attributes = {};
        const nodeArray = Array.prototype.slice.call(aNode.attributes);
        nodeArray.forEach(attribute => objNode.attributes[attribute.name] = attribute.value);
      }
      if (objNode.nodeName === 'TEXTAREA') {
        objNode.value = aNode.value;
      } else if (aNode.childNodes && aNode.childNodes.length > 0) {
        objNode.childNodes = [];
        const nodeArray = Array.prototype.slice.call(aNode.childNodes);
        nodeArray.forEach(childNode => objNode.childNodes.push(nodeToObj(childNode, options)));
      }
      if (options.valueDiffing) {
        if (aNode.checked !== undefined && aNode.type && ['radio', 'checkbox'].includes(aNode.type.toLowerCase())) {
          objNode.checked = aNode.checked;
        } else if (aNode.value !== undefined) {
          objNode.value = aNode.value;
        }
        if (aNode.selected !== undefined) {
          objNode.selected = aNode.selected;
        }
      }
    }
    return objNode
  }

  // from html-parse-stringify (MIT)

  const tagRE = /<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g;
  // re-used obj for quick lookups of components
  const empty = Object.create ? Object.create(null) : {};
  const attrRE = /([\w-:]+)|(["])([^"]*)\2/g;

  // create optimized lookup object for
  // void elements as listed here:
  // http://www.w3.org/html/wg/drafts/html/master/syntax.html#void-elements
  const lookup = {
    area: true,
    base: true,
    br: true,
    col: true,
    embed: true,
    hr: true,
    img: true,
    input: true,
    keygen: true,
    link: true,
    menuItem: true,
    meta: true,
    param: true,
    source: true,
    track: true,
    wbr: true
  };

  function parseTag(tag) {
    let i = 0;
    let key;
    const res = {
      nodeName: ''
    };

    tag.replace(attrRE, match => {
      if (i % 2) {
        key = match;
      } else if (i === 0) {
        if (lookup[match] || tag.charAt(tag.length - 2) === '/') {
          res.voidElement = true;
        }
        res.nodeName = match.toUpperCase();
      } else {
        if (!res.attributes) {
          res.attributes = {};
        }
        res.attributes[key] = match.replace(/^["]|["]$/g, '');
      }
      i++;
    });

    return res
  }


  function parse(
    html,
    options = {
      components: empty
    }
  ) {
    const result = [];
    let current;
    let level = -1;
    const arr = [];
    const byTag = {};
    let inComponent = false;

    html.replace(tagRE, (tag, index) => {
      if (inComponent) {
        if (tag !== (`</${current.nodeName}>`)) {
          return
        } else {
          inComponent = false;
        }
      }
      const isOpen = tag.charAt(1) !== '/';
      const start = index + tag.length;
      const nextChar = html.charAt(start);
      let parent;

      if (isOpen) {
        level++;

        current = parseTag(tag);
        if (current.type === 'tag' && options.components[current.nodeName]) {
          current.type = 'component';
          inComponent = true;
        }

        if (!current.voidElement && !inComponent && nextChar && nextChar !== '<') {
          if (!current.childNodes) {
            current.childNodes = [];
          }
          current.childNodes.push({
            nodeName: '#text',
            data: html.slice(start, html.indexOf('<', start))
          });
        }

        byTag[current.tagName] = current;

        // if we're at root, push new base node
        if (level === 0) {
          result.push(current);
        }

        parent = arr[level - 1];

        if (parent) {
          if (!parent.childNodes) {
            parent.childNodes = [];
          }
          parent.childNodes.push(current);
        }

        arr[level] = current;
      }

      if (!isOpen || current.voidElement) {
        level--;
        if (!inComponent && nextChar !== '<' && nextChar) {
          // trailing text node
          // if we're at the root, push a base text node. otherwise add as
          // a child to the current node.
          parent = level === -1 ? result : arr[level].childNodes || [];

          // calculate correct end of the data slice in case there's
          // no tag after the text node.
          const end = html.indexOf('<', start);
          const data = html.slice(start, end === -1 ? undefined : end);
          parent.push({
            nodeName: '#text',
            data
          });
        }
      }
    });

    return result[0]
  }

  function cleanObj(obj) {
    delete obj.voidElement;
    if (obj.childNodes) {
      obj.childNodes.forEach(child => cleanObj(child));
    }
    return obj
  }

  function stringToObj(string) {
    return cleanObj(parse(string))
  }

  // ===== Create a diff =====

  class DiffFinder {
    constructor(t1Node, t2Node, options) {
      this.options = options;
      this.t1 = (t1Node instanceof HTMLElement) ? nodeToObj(t1Node, this.options) : (typeof t1Node === 'string') ? stringToObj(t1Node, this.options) : JSON.parse(JSON.stringify(t1Node));
      this.t2 = (t2Node instanceof HTMLElement) ? nodeToObj(t2Node, this.options) : (typeof t2Node === 'string') ? stringToObj(t2Node, this.options) : JSON.parse(JSON.stringify(t2Node));
      this.diffcount = 0;
      this.foundAll = false;
      if (this.debug) {
        this.t1Orig = nodeToObj(t1Node, this.options);
        this.t2Orig = nodeToObj(t2Node, this.options);
      }

      this.tracker = new DiffTracker();
    }

    init() {
      return this.findDiffs(this.t1, this.t2)
    }

    findDiffs(t1, t2) {
      let diffs;
      do {
        if (this.options.debug) {
          this.diffcount += 1;
          if (this.diffcount > this.options.diffcap) {
            window.diffError = [this.t1Orig, this.t2Orig];
            throw new Error(`surpassed diffcap:${JSON.stringify(this.t1Orig)} -> ${JSON.stringify(this.t2Orig)}`)
          }
        }
        diffs = this.findNextDiff(t1, t2, []);

        if (diffs.length === 0) {
          // Last check if the elements really are the same now.
          // If not, remove all info about being done and start over.
          // Sometimes a node can be marked as done, but the creation of subsequent diffs means that it has to be changed again.
          if (!isEqual(t1, t2)) {
            if (this.foundAll) {
              console.error('Could not find remaining diffs!');
            } else {
              this.foundAll = true;
              removeDone(t1);
              diffs = this.findNextDiff(t1, t2, []);
            }
          }
        }
        if (diffs.length > 0) {
          this.foundAll = false;
          this.tracker.add(diffs);
          applyVirtual(t1, diffs, this.options);
        }
      } while (diffs.length > 0)

      return this.tracker.list
    }

    findNextDiff(t1, t2, route) {
      let diffs;
      let fdiffs;

      if (this.options.maxDepth && route.length > this.options.maxDepth) {
        return []
      }
      // outer differences?
      if (!t1.outerDone) {
        diffs = this.findOuterDiff(t1, t2, route);
        if (this.options.filterOuterDiff) {
          fdiffs = this.options.filterOuterDiff(t1, t2, diffs);
          if (fdiffs) diffs = fdiffs;
        }
        if (diffs.length > 0) {
          t1.outerDone = true;
          return diffs
        } else {
          t1.outerDone = true;
        }
      }
      // inner differences?
      if (!t1.innerDone) {
        diffs = this.findInnerDiff(t1, t2, route);
        if (diffs.length > 0) {
          return diffs
        } else {
          t1.innerDone = true;
        }
      }

      if (this.options.valueDiffing && !t1.valueDone) {
        // value differences?
        diffs = this.findValueDiff(t1, t2, route);

        if (diffs.length > 0) {
          t1.valueDone = true;
          return diffs
        } else {
          t1.valueDone = true;
        }
      }

      // no differences
      return []
    }

    findOuterDiff(t1, t2, route) {
      const diffs = [];
      let attr;
      let attr1;
      let attr2;
      let attrLength;
      let pos;
      let i;
      if (t1.nodeName !== t2.nodeName) {
        if (!route.length) {
          throw new Error('Top level nodes have to be of the same kind.')
        }
        return [new Diff()
          .setValue(this.options._const.action, this.options._const.replaceElement)
          .setValue(this.options._const.oldValue, cloneObj(t1))
          .setValue(this.options._const.newValue, cloneObj(t2))
          .setValue(this.options._const.route, route)
        ]
      }
      if (route.length && this.options.maxNodeDiffCount < Math.abs((t1.childNodes || []).length - (t2.childNodes || []).length)) {
        return [new Diff()
          .setValue(this.options._const.action, this.options._const.replaceElement)
          .setValue(this.options._const.oldValue, cloneObj(t1))
          .setValue(this.options._const.newValue, cloneObj(t2))
          .setValue(this.options._const.route, route)
        ]
      }

      if (t1.data !== t2.data) {
        // Comment or text node.
        if (t1.nodeName === '#text') {
          return [new Diff()
            .setValue(this.options._const.action, this.options._const.modifyTextElement)
            .setValue(this.options._const.route, route)
            .setValue(this.options._const.oldValue, t1.data)
            .setValue(this.options._const.newValue, t2.data)
          ]
        } else {
          return [new Diff()
            .setValue(this.options._const.action, this.options._const.modifyComment)
            .setValue(this.options._const.route, route)
            .setValue(this.options._const.oldValue, t1.data)
            .setValue(this.options._const.newValue, t2.data)
          ]
        }

      }

      attr1 = t1.attributes ? Object.keys(t1.attributes).sort() : [];
      attr2 = t2.attributes ? Object.keys(t2.attributes).sort() : [];

      attrLength = attr1.length;
      for (i = 0; i < attrLength; i++) {
        attr = attr1[i];
        pos = attr2.indexOf(attr);
        if (pos === -1) {
          diffs.push(new Diff()
            .setValue(this.options._const.action, this.options._const.removeAttribute)
            .setValue(this.options._const.route, route)
            .setValue(this.options._const.name, attr)
            .setValue(this.options._const.value, t1.attributes[attr])
          );
        } else {
          attr2.splice(pos, 1);
          if (t1.attributes[attr] !== t2.attributes[attr]) {
            diffs.push(new Diff()
              .setValue(this.options._const.action, this.options._const.modifyAttribute)
              .setValue(this.options._const.route, route)
              .setValue(this.options._const.name, attr)
              .setValue(this.options._const.oldValue, t1.attributes[attr])
              .setValue(this.options._const.newValue, t2.attributes[attr])
            );
          }
        }
      }

      attrLength = attr2.length;
      for (i = 0; i < attrLength; i++) {
        attr = attr2[i];
        diffs.push(new Diff()
          .setValue(this.options._const.action, this.options._const.addAttribute)
          .setValue(this.options._const.route, route)
          .setValue(this.options._const.name, attr)
          .setValue(this.options._const.value, t2.attributes[attr])
        );
      }

      return diffs
    }

    findInnerDiff(t1, t2, route) {
      const t1ChildNodes = t1.childNodes ? t1.childNodes.slice() : [];
      const t2ChildNodes = t2.childNodes ? t2.childNodes.slice() : [];
      const last = Math.max(t1ChildNodes.length, t2ChildNodes.length);
      let childNodesLengthDifference = Math.abs(t1ChildNodes.length - t2ChildNodes.length);
      let diffs = [];
      let index = 0;
      if (!this.options.maxChildCount || last < this.options.maxChildCount) {
        const subtrees = t1.subsets && t1.subsetsAge-- ? t1.subsets : (t1.childNodes && t2.childNodes) ? markSubTrees(t1, t2) : [];

        if (subtrees.length > 0) {
          /* One or more groups have been identified among the childnodes of t1
           * and t2.
           */
          diffs = this.attemptGroupRelocation(t1, t2, subtrees, route);
          if (diffs.length > 0) {
            return diffs
          }
        }
      }


      /* 0 or 1 groups of similar child nodes have been found
       * for t1 and t2. 1 If there is 1, it could be a sign that the
       * contents are the same. When the number of groups is below 2,
       * t1 and t2 are made to have the same length and each of the
       * pairs of child nodes are diffed.
       */

      for (let i = 0; i < last; i += 1) {
        const e1 = t1ChildNodes[i];
        const e2 = t2ChildNodes[i];

        if (childNodesLengthDifference) {
          /* t1 and t2 have different amounts of childNodes. Add
           * and remove as necessary to obtain the same length */
          if (e1 && !e2) {
            if (e1.nodeName === '#text') {
              diffs.push(new Diff()
                .setValue(this.options._const.action, this.options._const.removeTextElement)
                .setValue(this.options._const.route, route.concat(index))
                .setValue(this.options._const.value, e1.data)
              );
              index -= 1;
            } else {
              diffs.push(new Diff()
                .setValue(this.options._const.action, this.options._const.removeElement)
                .setValue(this.options._const.route, route.concat(index))
                .setValue(this.options._const.element, cloneObj(e1))
              );
              index -= 1;
            }

          } else if (e2 && !e1) {
            if (e2.nodeName === '#text') {
              diffs.push(new Diff()
                .setValue(this.options._const.action, this.options._const.addTextElement)
                .setValue(this.options._const.route, route.concat(index))
                .setValue(this.options._const.value, e2.data)
              );
            } else {
              diffs.push(new Diff()
                .setValue(this.options._const.action, this.options._const.addElement)
                .setValue(this.options._const.route, route.concat(index))
                .setValue(this.options._const.element, cloneObj(e2))
              );
            }
          }
        }
        /* We are now guaranteed that childNodes e1 and e2 exist,
         * and that they can be diffed.
         */
        /* Diffs in child nodes should not affect the parent node,
         * so we let these diffs be submitted together with other
         * diffs.
         */

        if (e1 && e2) {
          if (!this.options.maxChildCount || last < this.options.maxChildCount) {
            diffs = diffs.concat(this.findNextDiff(e1, e2, route.concat(index)));
          } else if (!isEqual(e1, e2)) {
            if (t1ChildNodes.length > t2ChildNodes.length) {
              diffs = diffs.concat([
                new Diff()
                .setValue(this.options._const.action, this.options._const.removeElement)
                .setValue(this.options._const.element, cloneObj(e1))
                .setValue(this.options._const.route, route.concat(index))
              ]);
              t1ChildNodes.splice(i, 1);
              index -= 1;
              childNodesLengthDifference -= 1;
            } else if (t1ChildNodes.length < t2ChildNodes.length) {
              diffs = diffs.concat([
                new Diff()
                .setValue(this.options._const.action, this.options._const.addElement)
                .setValue(this.options._const.element, cloneObj(e2))
                .setValue(this.options._const.route, route.concat(index))
              ]);
              t1ChildNodes.splice(i, 0, {});
              childNodesLengthDifference -= 1;
            } else {
              diffs = diffs.concat([
                new Diff()
                .setValue(this.options._const.action, this.options._const.replaceElement)
                .setValue(this.options._const.oldValue, cloneObj(e1))
                .setValue(this.options._const.newValue, cloneObj(e2))
                .setValue(this.options._const.route, route.concat(index))
              ]);
            }

          }

        }
        index += 1;

      }
      t1.innerDone = true;
      return diffs
    }

    attemptGroupRelocation(t1, t2, subtrees, route) {
      /* Either t1.childNodes and t2.childNodes have the same length, or
       * there are at least two groups of similar elements can be found.
       * attempts are made at equalizing t1 with t2. First all initial
       * elements with no group affiliation (gaps=true) are removed (if
       * only in t1) or added (if only in t2). Then the creation of a group
       * relocation diff is attempted.
       */
      const gapInformation = getGapInformation(t1, t2, subtrees);
      const gaps1 = gapInformation.gaps1;
      const gaps2 = gapInformation.gaps2;
      let shortest = Math.min(gaps1.length, gaps2.length);
      let destinationDifferent;
      let toGroup;
      let group;
      let node;
      let similarNode;
      let testI;
      const diffs = [];


      for (let index2 = 0, index1 = 0; index2 < shortest; index1 += 1, index2 += 1) {
        if (gaps1[index2] === true) {
          node = t1.childNodes[index1];
          if (node.nodeName === '#text') {
            if (t2.childNodes[index2].nodeName === '#text' && node.data !== t2.childNodes[index2].data) {
              testI = index1;
              while (t1.childNodes.length > testI + 1 && t1.childNodes[testI + 1].nodeName === '#text') {
                testI += 1;
                if (t2.childNodes[index2].data === t1.childNodes[testI].data) {
                  similarNode = true;
                  break
                }
              }
              if (!similarNode) {
                diffs.push(new Diff()
                  .setValue(this.options._const.action, this.options._const.modifyTextElement)
                  .setValue(this.options._const.route, route.concat(index2))
                  .setValue(this.options._const.oldValue, node.data)
                  .setValue(this.options._const.newValue, t2.childNodes[index2].data)
                );
                return diffs
              }
            }
            diffs.push(new Diff()
              .setValue(this.options._const.action, this.options._const.removeTextElement)
              .setValue(this.options._const.route, route.concat(index2))
              .setValue(this.options._const.value, node.data)
            );
            gaps1.splice(index2, 1);
            shortest = Math.min(gaps1.length, gaps2.length);
            index2 -= 1;
          } else {
            diffs.push(new Diff()
              .setValue(this.options._const.action, this.options._const.removeElement)
              .setValue(this.options._const.route, route.concat(index2))
              .setValue(this.options._const.element, cloneObj(node))
            );
            gaps1.splice(index2, 1);
            shortest = Math.min(gaps1.length, gaps2.length);
            index2 -= 1;
          }

        } else if (gaps2[index2] === true) {
          node = t2.childNodes[index2];
          if (node.nodeName === '#text') {
            diffs.push(new Diff()
              .setValue(this.options._const.action, this.options._const.addTextElement)
              .setValue(this.options._const.route, route.concat(index2))
              .setValue(this.options._const.value, node.data)
            );
            gaps1.splice(index2, 0, true);
            shortest = Math.min(gaps1.length, gaps2.length);
            index1 -= 1;
          } else {
            diffs.push(new Diff()
              .setValue(this.options._const.action, this.options._const.addElement)
              .setValue(this.options._const.route, route.concat(index2))
              .setValue(this.options._const.element, cloneObj(node))
            );
            gaps1.splice(index2, 0, true);
            shortest = Math.min(gaps1.length, gaps2.length);
            index1 -= 1;
          }

        } else if (gaps1[index2] !== gaps2[index2]) {
          if (diffs.length > 0) {
            return diffs
          }
          // group relocation
          group = subtrees[gaps1[index2]];
          toGroup = Math.min(group.newValue, (t1.childNodes.length - group.length));
          if (toGroup !== group.oldValue) {
            // Check whether destination nodes are different than originating ones.
            destinationDifferent = false;
            for (let j = 0; j < group.length; j += 1) {
              if (!roughlyEqual(t1.childNodes[toGroup + j], t1.childNodes[group.oldValue + j], [], false, true)) {
                destinationDifferent = true;
              }
            }
            if (destinationDifferent) {
              return [new Diff()
                .setValue(this.options._const.action, this.options._const.relocateGroup)
                .setValue('groupLength', group.length)
                .setValue(this.options._const.from, group.oldValue)
                .setValue(this.options._const.to, toGroup)
                .setValue(this.options._const.route, route)
              ]
            }
          }
        }
      }
      return diffs
    }

    findValueDiff(t1, t2, route) {
      // Differences of value. Only useful if the value/selection/checked value
      // differs from what is represented in the DOM. For example in the case
      // of filled out forms, etc.
      const diffs = [];

      if (t1.selected !== t2.selected) {
        diffs.push(new Diff()
          .setValue(this.options._const.action, this.options._const.modifySelected)
          .setValue(this.options._const.oldValue, t1.selected)
          .setValue(this.options._const.newValue, t2.selected)
          .setValue(this.options._const.route, route)
        );
      }

      if ((t1.value || t2.value) && t1.value !== t2.value && t1.nodeName !== 'OPTION') {
        diffs.push(new Diff()
          .setValue(this.options._const.action, this.options._const.modifyValue)
          .setValue(this.options._const.oldValue, t1.value || "")
          .setValue(this.options._const.newValue, t2.value || "")
          .setValue(this.options._const.route, route)
        );
      }
      if (t1.checked !== t2.checked) {
        diffs.push(new Diff()
          .setValue(this.options._const.action, this.options._const.modifyChecked)
          .setValue(this.options._const.oldValue, t1.checked)
          .setValue(this.options._const.newValue, t2.checked)
          .setValue(this.options._const.route, route)
        );
      }

      return diffs
    }

  }

  // from html-parse-stringify (MIT)

  const DEFAULT_OPTIONS$1 = {
    debug: false,
    diffcap: 10, // Limit for how many diffs are accepting when debugging. Inactive when debug is false.
    maxDepth: false, // False or a numeral. If set to a numeral, limits the level of depth that the the diff mechanism looks for differences. If false, goes through the entire tree.
    maxChildCount: 50, // False or a numeral. If set to a numeral, only does a simplified form of diffing of contents so that the number of diffs cannot be higher than the number of child nodes.
    valueDiffing: true, // Whether to take into consideration the values of forms that differ from auto assigned values (when a user fills out a form).
    // syntax: textDiff: function (node, currentValue, expectedValue, newValue)
    textDiff(node, currentValue, expectedValue, newValue) {
      node.data = newValue;
      return
    },
    // empty functions were benchmarked as running faster than both
    // `f && f()` and `if (f) { f(); }`
    preVirtualDiffApply() {},
    postVirtualDiffApply() {},
    preDiffApply() {},
    postDiffApply() {},
    filterOuterDiff: null,
    compress: false, // Whether to work with compressed diffs
    _const: false, // object with strings for every change types to be used in diffs.
    document: window && window.document ? window.document : false
  };


  class DiffDOM {
    constructor(options = {}) {

      this.options = options;
      // IE11 doesn't have Object.assign and buble doesn't translate object spreaders
      // by default, so this is the safest way of doing it currently.
      Object.entries(DEFAULT_OPTIONS$1).forEach(([key, value]) => {
        if (!Object.prototype.hasOwnProperty.call(this.options, key)) {
          this.options[key] = value;
        }
      });

      if (!this.options._const) {
        const varNames = ["addAttribute", "modifyAttribute", "removeAttribute",
          "modifyTextElement", "relocateGroup", "removeElement", "addElement",
          "removeTextElement", "addTextElement", "replaceElement", "modifyValue",
          "modifyChecked", "modifySelected", "modifyComment", "action", "route",
          "oldValue", "newValue", "element", "group", "from", "to", "name",
          "value", "data", "attributes", "nodeName", "childNodes", "checked",
          "selected"
        ];
        this.options._const = {};
        if (this.options.compress) {
          varNames.forEach((varName, index) => this.options._const[varName] = index);
        } else {
          varNames.forEach(varName => this.options._const[varName] = varName);
        }
      }

      this.DiffFinder = DiffFinder;

    }

    apply(tree, diffs) {
      return applyDOM(tree, diffs, this.options)
    }

    undo(tree, diffs) {
      return undoDOM(tree, diffs, this.options)
    }

    diff(t1Node, t2Node) {
      const finder = new this.DiffFinder(t1Node, t2Node, this.options);
      return finder.init()
    }

  }

  /**
   * This library modifies the diff-patch-match library by Neil Fraser
   * by removing the patch and match functionality and certain advanced
   * options in the diff function. The original license is as follows:
   *
   * ===
   *
   * Diff Match and Patch
   *
   * Copyright 2006 Google Inc.
   * http://code.google.com/p/google-diff-match-patch/
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */


  /**
   * The data structure representing a diff is an array of tuples:
   * [[DIFF_DELETE, 'Hello'], [DIFF_INSERT, 'Goodbye'], [DIFF_EQUAL, ' world.']]
   * which means: delete 'Hello', add 'Goodbye' and keep ' world.'
   */
  var DIFF_DELETE = -1;
  var DIFF_INSERT = 1;
  var DIFF_EQUAL = 0;


  /**
   * Find the differences between two texts.  Simplifies the problem by stripping
   * any common prefix or suffix off the texts before diffing.
   * @param {string} text1 Old string to be diffed.
   * @param {string} text2 New string to be diffed.
   * @param {Int|Object} [cursor_pos] Edit position in text1 or object with more info
   * @return {Array} Array of diff tuples.
   */
  function diff_main(text1, text2, cursor_pos, _fix_unicode) {
    // Check for equality
    if (text1 === text2) {
      if (text1) {
        return [[DIFF_EQUAL, text1]];
      }
      return [];
    }

    if (cursor_pos != null) {
      var editdiff = find_cursor_edit_diff(text1, text2, cursor_pos);
      if (editdiff) {
        return editdiff;
      }
    }

    // Trim off common prefix (speedup).
    var commonlength = diff_commonPrefix(text1, text2);
    var commonprefix = text1.substring(0, commonlength);
    text1 = text1.substring(commonlength);
    text2 = text2.substring(commonlength);

    // Trim off common suffix (speedup).
    commonlength = diff_commonSuffix(text1, text2);
    var commonsuffix = text1.substring(text1.length - commonlength);
    text1 = text1.substring(0, text1.length - commonlength);
    text2 = text2.substring(0, text2.length - commonlength);

    // Compute the diff on the middle block.
    var diffs = diff_compute_(text1, text2);

    // Restore the prefix and suffix.
    if (commonprefix) {
      diffs.unshift([DIFF_EQUAL, commonprefix]);
    }
    if (commonsuffix) {
      diffs.push([DIFF_EQUAL, commonsuffix]);
    }
    diff_cleanupMerge(diffs, _fix_unicode);
    return diffs;
  }

  /**
   * Find the differences between two texts.  Assumes that the texts do not
   * have any common prefix or suffix.
   * @param {string} text1 Old string to be diffed.
   * @param {string} text2 New string to be diffed.
   * @return {Array} Array of diff tuples.
   */
  function diff_compute_(text1, text2) {
    var diffs;

    if (!text1) {
      // Just add some text (speedup).
      return [[DIFF_INSERT, text2]];
    }

    if (!text2) {
      // Just delete some text (speedup).
      return [[DIFF_DELETE, text1]];
    }

    var longtext = text1.length > text2.length ? text1 : text2;
    var shorttext = text1.length > text2.length ? text2 : text1;
    var i = longtext.indexOf(shorttext);
    if (i !== -1) {
      // Shorter text is inside the longer text (speedup).
      diffs = [
        [DIFF_INSERT, longtext.substring(0, i)],
        [DIFF_EQUAL, shorttext],
        [DIFF_INSERT, longtext.substring(i + shorttext.length)]
      ];
      // Swap insertions for deletions if diff is reversed.
      if (text1.length > text2.length) {
        diffs[0][0] = diffs[2][0] = DIFF_DELETE;
      }
      return diffs;
    }

    if (shorttext.length === 1) {
      // Single character string.
      // After the previous speedup, the character can't be an equality.
      return [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
    }

    // Check to see if the problem can be split in two.
    var hm = diff_halfMatch_(text1, text2);
    if (hm) {
      // A half-match was found, sort out the return data.
      var text1_a = hm[0];
      var text1_b = hm[1];
      var text2_a = hm[2];
      var text2_b = hm[3];
      var mid_common = hm[4];
      // Send both pairs off for separate processing.
      var diffs_a = diff_main(text1_a, text2_a);
      var diffs_b = diff_main(text1_b, text2_b);
      // Merge the results.
      return diffs_a.concat([[DIFF_EQUAL, mid_common]], diffs_b);
    }

    return diff_bisect_(text1, text2);
  }

  /**
   * Find the 'middle snake' of a diff, split the problem in two
   * and return the recursively constructed diff.
   * See Myers 1986 paper: An O(ND) Difference Algorithm and Its Variations.
   * @param {string} text1 Old string to be diffed.
   * @param {string} text2 New string to be diffed.
   * @return {Array} Array of diff tuples.
   * @private
   */
  function diff_bisect_(text1, text2) {
    // Cache the text lengths to prevent multiple calls.
    var text1_length = text1.length;
    var text2_length = text2.length;
    var max_d = Math.ceil((text1_length + text2_length) / 2);
    var v_offset = max_d;
    var v_length = 2 * max_d;
    var v1 = new Array(v_length);
    var v2 = new Array(v_length);
    // Setting all elements to -1 is faster in Chrome & Firefox than mixing
    // integers and undefined.
    for (var x = 0; x < v_length; x++) {
      v1[x] = -1;
      v2[x] = -1;
    }
    v1[v_offset + 1] = 0;
    v2[v_offset + 1] = 0;
    var delta = text1_length - text2_length;
    // If the total number of characters is odd, then the front path will collide
    // with the reverse path.
    var front = (delta % 2 !== 0);
    // Offsets for start and end of k loop.
    // Prevents mapping of space beyond the grid.
    var k1start = 0;
    var k1end = 0;
    var k2start = 0;
    var k2end = 0;
    for (var d = 0; d < max_d; d++) {
      // Walk the front path one step.
      for (var k1 = -d + k1start; k1 <= d - k1end; k1 += 2) {
        var k1_offset = v_offset + k1;
        var x1;
        if (k1 === -d || (k1 !== d && v1[k1_offset - 1] < v1[k1_offset + 1])) {
          x1 = v1[k1_offset + 1];
        } else {
          x1 = v1[k1_offset - 1] + 1;
        }
        var y1 = x1 - k1;
        while (
          x1 < text1_length && y1 < text2_length &&
          text1.charAt(x1) === text2.charAt(y1)
        ) {
          x1++;
          y1++;
        }
        v1[k1_offset] = x1;
        if (x1 > text1_length) {
          // Ran off the right of the graph.
          k1end += 2;
        } else if (y1 > text2_length) {
          // Ran off the bottom of the graph.
          k1start += 2;
        } else if (front) {
          var k2_offset = v_offset + delta - k1;
          if (k2_offset >= 0 && k2_offset < v_length && v2[k2_offset] !== -1) {
            // Mirror x2 onto top-left coordinate system.
            var x2 = text1_length - v2[k2_offset];
            if (x1 >= x2) {
              // Overlap detected.
              return diff_bisectSplit_(text1, text2, x1, y1);
            }
          }
        }
      }

      // Walk the reverse path one step.
      for (var k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
        var k2_offset = v_offset + k2;
        var x2;
        if (k2 === -d || (k2 !== d && v2[k2_offset - 1] < v2[k2_offset + 1])) {
          x2 = v2[k2_offset + 1];
        } else {
          x2 = v2[k2_offset - 1] + 1;
        }
        var y2 = x2 - k2;
        while (
          x2 < text1_length && y2 < text2_length &&
          text1.charAt(text1_length - x2 - 1) === text2.charAt(text2_length - y2 - 1)
        ) {
          x2++;
          y2++;
        }
        v2[k2_offset] = x2;
        if (x2 > text1_length) {
          // Ran off the left of the graph.
          k2end += 2;
        } else if (y2 > text2_length) {
          // Ran off the top of the graph.
          k2start += 2;
        } else if (!front) {
          var k1_offset = v_offset + delta - k2;
          if (k1_offset >= 0 && k1_offset < v_length && v1[k1_offset] !== -1) {
            var x1 = v1[k1_offset];
            var y1 = v_offset + x1 - k1_offset;
            // Mirror x2 onto top-left coordinate system.
            x2 = text1_length - x2;
            if (x1 >= x2) {
              // Overlap detected.
              return diff_bisectSplit_(text1, text2, x1, y1);
            }
          }
        }
      }
    }
    // Diff took too long and hit the deadline or
    // number of diffs equals number of characters, no commonality at all.
    return [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
  }

  /**
   * Given the location of the 'middle snake', split the diff in two parts
   * and recurse.
   * @param {string} text1 Old string to be diffed.
   * @param {string} text2 New string to be diffed.
   * @param {number} x Index of split point in text1.
   * @param {number} y Index of split point in text2.
   * @return {Array} Array of diff tuples.
   */
  function diff_bisectSplit_(text1, text2, x, y) {
    var text1a = text1.substring(0, x);
    var text2a = text2.substring(0, y);
    var text1b = text1.substring(x);
    var text2b = text2.substring(y);

    // Compute both diffs serially.
    var diffs = diff_main(text1a, text2a);
    var diffsb = diff_main(text1b, text2b);

    return diffs.concat(diffsb);
  }

  /**
   * Determine the common prefix of two strings.
   * @param {string} text1 First string.
   * @param {string} text2 Second string.
   * @return {number} The number of characters common to the start of each
   *     string.
   */
  function diff_commonPrefix(text1, text2) {
    // Quick check for common null cases.
    if (!text1 || !text2 || text1.charAt(0) !== text2.charAt(0)) {
      return 0;
    }
    // Binary search.
    // Performance analysis: http://neil.fraser.name/news/2007/10/09/
    var pointermin = 0;
    var pointermax = Math.min(text1.length, text2.length);
    var pointermid = pointermax;
    var pointerstart = 0;
    while (pointermin < pointermid) {
      if (
        text1.substring(pointerstart, pointermid) ==
        text2.substring(pointerstart, pointermid)
      ) {
        pointermin = pointermid;
        pointerstart = pointermin;
      } else {
        pointermax = pointermid;
      }
      pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
    }

    if (is_surrogate_pair_start(text1.charCodeAt(pointermid - 1))) {
      pointermid--;
    }

    return pointermid;
  }

  /**
   * Determine the common suffix of two strings.
   * @param {string} text1 First string.
   * @param {string} text2 Second string.
   * @return {number} The number of characters common to the end of each string.
   */
  function diff_commonSuffix(text1, text2) {
    // Quick check for common null cases.
    if (!text1 || !text2 || text1.slice(-1) !== text2.slice(-1)) {
      return 0;
    }
    // Binary search.
    // Performance analysis: http://neil.fraser.name/news/2007/10/09/
    var pointermin = 0;
    var pointermax = Math.min(text1.length, text2.length);
    var pointermid = pointermax;
    var pointerend = 0;
    while (pointermin < pointermid) {
      if (
        text1.substring(text1.length - pointermid, text1.length - pointerend) ==
        text2.substring(text2.length - pointermid, text2.length - pointerend)
      ) {
        pointermin = pointermid;
        pointerend = pointermin;
      } else {
        pointermax = pointermid;
      }
      pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
    }

    if (is_surrogate_pair_end(text1.charCodeAt(text1.length - pointermid))) {
      pointermid--;
    }

    return pointermid;
  }

  /**
   * Do the two texts share a substring which is at least half the length of the
   * longer text?
   * This speedup can produce non-minimal diffs.
   * @param {string} text1 First string.
   * @param {string} text2 Second string.
   * @return {Array.<string>} Five element Array, containing the prefix of
   *     text1, the suffix of text1, the prefix of text2, the suffix of
   *     text2 and the common middle.  Or null if there was no match.
   */
  function diff_halfMatch_(text1, text2) {
    var longtext = text1.length > text2.length ? text1 : text2;
    var shorttext = text1.length > text2.length ? text2 : text1;
    if (longtext.length < 4 || shorttext.length * 2 < longtext.length) {
      return null;  // Pointless.
    }

    /**
     * Does a substring of shorttext exist within longtext such that the substring
     * is at least half the length of longtext?
     * Closure, but does not reference any external variables.
     * @param {string} longtext Longer string.
     * @param {string} shorttext Shorter string.
     * @param {number} i Start index of quarter length substring within longtext.
     * @return {Array.<string>} Five element Array, containing the prefix of
     *     longtext, the suffix of longtext, the prefix of shorttext, the suffix
     *     of shorttext and the common middle.  Or null if there was no match.
     * @private
     */
    function diff_halfMatchI_(longtext, shorttext, i) {
      // Start with a 1/4 length substring at position i as a seed.
      var seed = longtext.substring(i, i + Math.floor(longtext.length / 4));
      var j = -1;
      var best_common = '';
      var best_longtext_a, best_longtext_b, best_shorttext_a, best_shorttext_b;
      while ((j = shorttext.indexOf(seed, j + 1)) !== -1) {
        var prefixLength = diff_commonPrefix(
          longtext.substring(i), shorttext.substring(j));
        var suffixLength = diff_commonSuffix(
          longtext.substring(0, i), shorttext.substring(0, j));
        if (best_common.length < suffixLength + prefixLength) {
          best_common = shorttext.substring(
            j - suffixLength, j) + shorttext.substring(j, j + prefixLength);
          best_longtext_a = longtext.substring(0, i - suffixLength);
          best_longtext_b = longtext.substring(i + prefixLength);
          best_shorttext_a = shorttext.substring(0, j - suffixLength);
          best_shorttext_b = shorttext.substring(j + prefixLength);
        }
      }
      if (best_common.length * 2 >= longtext.length) {
        return [
          best_longtext_a, best_longtext_b,
          best_shorttext_a, best_shorttext_b, best_common
        ];
      } else {
        return null;
      }
    }

    // First check if the second quarter is the seed for a half-match.
    var hm1 = diff_halfMatchI_(longtext, shorttext, Math.ceil(longtext.length / 4));
    // Check again based on the third quarter.
    var hm2 = diff_halfMatchI_(longtext, shorttext, Math.ceil(longtext.length / 2));
    var hm;
    if (!hm1 && !hm2) {
      return null;
    } else if (!hm2) {
      hm = hm1;
    } else if (!hm1) {
      hm = hm2;
    } else {
      // Both matched.  Select the longest.
      hm = hm1[4].length > hm2[4].length ? hm1 : hm2;
    }

    // A half-match was found, sort out the return data.
    var text1_a, text1_b, text2_a, text2_b;
    if (text1.length > text2.length) {
      text1_a = hm[0];
      text1_b = hm[1];
      text2_a = hm[2];
      text2_b = hm[3];
    } else {
      text2_a = hm[0];
      text2_b = hm[1];
      text1_a = hm[2];
      text1_b = hm[3];
    }
    var mid_common = hm[4];
    return [text1_a, text1_b, text2_a, text2_b, mid_common];
  }

  /**
   * Reorder and merge like edit sections.  Merge equalities.
   * Any edit section can move as long as it doesn't cross an equality.
   * @param {Array} diffs Array of diff tuples.
   * @param {boolean} fix_unicode Whether to normalize to a unicode-correct diff
   */
  function diff_cleanupMerge(diffs, fix_unicode) {
    diffs.push([DIFF_EQUAL, '']);  // Add a dummy entry at the end.
    var pointer = 0;
    var count_delete = 0;
    var count_insert = 0;
    var text_delete = '';
    var text_insert = '';
    var commonlength;
    while (pointer < diffs.length) {
      if (pointer < diffs.length - 1 && !diffs[pointer][1]) {
        diffs.splice(pointer, 1);
        continue;
      }
      switch (diffs[pointer][0]) {
        case DIFF_INSERT:

          count_insert++;
          text_insert += diffs[pointer][1];
          pointer++;
          break;
        case DIFF_DELETE:
          count_delete++;
          text_delete += diffs[pointer][1];
          pointer++;
          break;
        case DIFF_EQUAL:
          var previous_equality = pointer - count_insert - count_delete - 1;
          if (fix_unicode) {
            // prevent splitting of unicode surrogate pairs.  when fix_unicode is true,
            // we assume that the old and new text in the diff are complete and correct
            // unicode-encoded JS strings, but the tuple boundaries may fall between
            // surrogate pairs.  we fix this by shaving off stray surrogates from the end
            // of the previous equality and the beginning of this equality.  this may create
            // empty equalities or a common prefix or suffix.  for example, if AB and AC are
            // emojis, `[[0, 'A'], [-1, 'BA'], [0, 'C']]` would turn into deleting 'ABAC' and
            // inserting 'AC', and then the common suffix 'AC' will be eliminated.  in this
            // particular case, both equalities go away, we absorb any previous inequalities,
            // and we keep scanning for the next equality before rewriting the tuples.
            if (previous_equality >= 0 && ends_with_pair_start(diffs[previous_equality][1])) {
              var stray = diffs[previous_equality][1].slice(-1);
              diffs[previous_equality][1] = diffs[previous_equality][1].slice(0, -1);
              text_delete = stray + text_delete;
              text_insert = stray + text_insert;
              if (!diffs[previous_equality][1]) {
                // emptied out previous equality, so delete it and include previous delete/insert
                diffs.splice(previous_equality, 1);
                pointer--;
                var k = previous_equality - 1;
                if (diffs[k] && diffs[k][0] === DIFF_INSERT) {
                  count_insert++;
                  text_insert = diffs[k][1] + text_insert;
                  k--;
                }
                if (diffs[k] && diffs[k][0] === DIFF_DELETE) {
                  count_delete++;
                  text_delete = diffs[k][1] + text_delete;
                  k--;
                }
                previous_equality = k;
              }
            }
            if (starts_with_pair_end(diffs[pointer][1])) {
              var stray = diffs[pointer][1].charAt(0);
              diffs[pointer][1] = diffs[pointer][1].slice(1);
              text_delete += stray;
              text_insert += stray;
            }
          }
          if (pointer < diffs.length - 1 && !diffs[pointer][1]) {
            // for empty equality not at end, wait for next equality
            diffs.splice(pointer, 1);
            break;
          }
          if (text_delete.length > 0 || text_insert.length > 0) {
            // note that diff_commonPrefix and diff_commonSuffix are unicode-aware
            if (text_delete.length > 0 && text_insert.length > 0) {
              // Factor out any common prefixes.
              commonlength = diff_commonPrefix(text_insert, text_delete);
              if (commonlength !== 0) {
                if (previous_equality >= 0) {
                  diffs[previous_equality][1] += text_insert.substring(0, commonlength);
                } else {
                  diffs.splice(0, 0, [DIFF_EQUAL, text_insert.substring(0, commonlength)]);
                  pointer++;
                }
                text_insert = text_insert.substring(commonlength);
                text_delete = text_delete.substring(commonlength);
              }
              // Factor out any common suffixes.
              commonlength = diff_commonSuffix(text_insert, text_delete);
              if (commonlength !== 0) {
                diffs[pointer][1] =
                  text_insert.substring(text_insert.length - commonlength) + diffs[pointer][1];
                text_insert = text_insert.substring(0, text_insert.length - commonlength);
                text_delete = text_delete.substring(0, text_delete.length - commonlength);
              }
            }
            // Delete the offending records and add the merged ones.
            var n = count_insert + count_delete;
            if (text_delete.length === 0 && text_insert.length === 0) {
              diffs.splice(pointer - n, n);
              pointer = pointer - n;
            } else if (text_delete.length === 0) {
              diffs.splice(pointer - n, n, [DIFF_INSERT, text_insert]);
              pointer = pointer - n + 1;
            } else if (text_insert.length === 0) {
              diffs.splice(pointer - n, n, [DIFF_DELETE, text_delete]);
              pointer = pointer - n + 1;
            } else {
              diffs.splice(pointer - n, n, [DIFF_DELETE, text_delete], [DIFF_INSERT, text_insert]);
              pointer = pointer - n + 2;
            }
          }
          if (pointer !== 0 && diffs[pointer - 1][0] === DIFF_EQUAL) {
            // Merge this equality with the previous one.
            diffs[pointer - 1][1] += diffs[pointer][1];
            diffs.splice(pointer, 1);
          } else {
            pointer++;
          }
          count_insert = 0;
          count_delete = 0;
          text_delete = '';
          text_insert = '';
          break;
      }
    }
    if (diffs[diffs.length - 1][1] === '') {
      diffs.pop();  // Remove the dummy entry at the end.
    }

    // Second pass: look for single edits surrounded on both sides by equalities
    // which can be shifted sideways to eliminate an equality.
    // e.g: A<ins>BA</ins>C -> <ins>AB</ins>AC
    var changes = false;
    pointer = 1;
    // Intentionally ignore the first and last element (don't need checking).
    while (pointer < diffs.length - 1) {
      if (diffs[pointer - 1][0] === DIFF_EQUAL &&
        diffs[pointer + 1][0] === DIFF_EQUAL) {
        // This is a single edit surrounded by equalities.
        if (diffs[pointer][1].substring(diffs[pointer][1].length -
          diffs[pointer - 1][1].length) === diffs[pointer - 1][1]) {
          // Shift the edit over the previous equality.
          diffs[pointer][1] = diffs[pointer - 1][1] +
            diffs[pointer][1].substring(0, diffs[pointer][1].length -
              diffs[pointer - 1][1].length);
          diffs[pointer + 1][1] = diffs[pointer - 1][1] + diffs[pointer + 1][1];
          diffs.splice(pointer - 1, 1);
          changes = true;
        } else if (diffs[pointer][1].substring(0, diffs[pointer + 1][1].length) ==
          diffs[pointer + 1][1]) {
          // Shift the edit over the next equality.
          diffs[pointer - 1][1] += diffs[pointer + 1][1];
          diffs[pointer][1] =
            diffs[pointer][1].substring(diffs[pointer + 1][1].length) +
            diffs[pointer + 1][1];
          diffs.splice(pointer + 1, 1);
          changes = true;
        }
      }
      pointer++;
    }
    // If shifts were made, the diff needs reordering and another shift sweep.
    if (changes) {
      diff_cleanupMerge(diffs, fix_unicode);
    }
  }
  function is_surrogate_pair_start(charCode) {
    return charCode >= 0xD800 && charCode <= 0xDBFF;
  }

  function is_surrogate_pair_end(charCode) {
    return charCode >= 0xDC00 && charCode <= 0xDFFF;
  }

  function starts_with_pair_end(str) {
    return is_surrogate_pair_end(str.charCodeAt(0));
  }

  function ends_with_pair_start(str) {
    return is_surrogate_pair_start(str.charCodeAt(str.length - 1));
  }

  function remove_empty_tuples(tuples) {
    var ret = [];
    for (var i = 0; i < tuples.length; i++) {
      if (tuples[i][1].length > 0) {
        ret.push(tuples[i]);
      }
    }
    return ret;
  }

  function make_edit_splice(before, oldMiddle, newMiddle, after) {
    if (ends_with_pair_start(before) || starts_with_pair_end(after)) {
      return null;
    }
    return remove_empty_tuples([
      [DIFF_EQUAL, before],
      [DIFF_DELETE, oldMiddle],
      [DIFF_INSERT, newMiddle],
      [DIFF_EQUAL, after]
    ]);
  }

  function find_cursor_edit_diff(oldText, newText, cursor_pos) {
    // note: this runs after equality check has ruled out exact equality
    var oldRange = typeof cursor_pos === 'number' ?
      { index: cursor_pos, length: 0 } : cursor_pos.oldRange;
    var newRange = typeof cursor_pos === 'number' ?
      null : cursor_pos.newRange;
    // take into account the old and new selection to generate the best diff
    // possible for a text edit.  for example, a text change from "xxx" to "xx"
    // could be a delete or forwards-delete of any one of the x's, or the
    // result of selecting two of the x's and typing "x".
    var oldLength = oldText.length;
    var newLength = newText.length;
    if (oldRange.length === 0 && (newRange === null || newRange.length === 0)) {
      // see if we have an insert or delete before or after cursor
      var oldCursor = oldRange.index;
      var oldBefore = oldText.slice(0, oldCursor);
      var oldAfter = oldText.slice(oldCursor);
      var maybeNewCursor = newRange ? newRange.index : null;
      editBefore: {
        // is this an insert or delete right before oldCursor?
        var newCursor = oldCursor + newLength - oldLength;
        if (maybeNewCursor !== null && maybeNewCursor !== newCursor) {
          break editBefore;
        }
        if (newCursor < 0 || newCursor > newLength) {
          break editBefore;
        }
        var newBefore = newText.slice(0, newCursor);
        var newAfter = newText.slice(newCursor);
        if (newAfter !== oldAfter) {
          break editBefore;
        }
        var prefixLength = Math.min(oldCursor, newCursor);
        var oldPrefix = oldBefore.slice(0, prefixLength);
        var newPrefix = newBefore.slice(0, prefixLength);
        if (oldPrefix !== newPrefix) {
          break editBefore;
        }
        var oldMiddle = oldBefore.slice(prefixLength);
        var newMiddle = newBefore.slice(prefixLength);
        return make_edit_splice(oldPrefix, oldMiddle, newMiddle, oldAfter);
      }
      editAfter: {
        // is this an insert or delete right after oldCursor?
        if (maybeNewCursor !== null && maybeNewCursor !== oldCursor) {
          break editAfter;
        }
        var cursor = oldCursor;
        var newBefore = newText.slice(0, cursor);
        var newAfter = newText.slice(cursor);
        if (newBefore !== oldBefore) {
          break editAfter;
        }
        var suffixLength = Math.min(oldLength - cursor, newLength - cursor);
        var oldSuffix = oldAfter.slice(oldAfter.length - suffixLength);
        var newSuffix = newAfter.slice(newAfter.length - suffixLength);
        if (oldSuffix !== newSuffix) {
          break editAfter;
        }
        var oldMiddle = oldAfter.slice(0, oldAfter.length - suffixLength);
        var newMiddle = newAfter.slice(0, newAfter.length - suffixLength);
        return make_edit_splice(oldBefore, oldMiddle, newMiddle, oldSuffix);
      }
    }
    if (oldRange.length > 0 && newRange && newRange.length === 0) {
      replaceRange: {
        // see if diff could be a splice of the old selection range
        var oldPrefix = oldText.slice(0, oldRange.index);
        var oldSuffix = oldText.slice(oldRange.index + oldRange.length);
        var prefixLength = oldPrefix.length;
        var suffixLength = oldSuffix.length;
        if (newLength < prefixLength + suffixLength) {
          break replaceRange;
        }
        var newPrefix = newText.slice(0, prefixLength);
        var newSuffix = newText.slice(newLength - suffixLength);
        if (oldPrefix !== newPrefix || oldSuffix !== newSuffix) {
          break replaceRange;
        }
        var oldMiddle = oldText.slice(prefixLength, oldLength - suffixLength);
        var newMiddle = newText.slice(prefixLength, newLength - suffixLength);
        return make_edit_splice(oldPrefix, oldMiddle, newMiddle, oldSuffix);
      }
    }

    return null;
  }

  function diff(text1, text2, cursor_pos) {
    // only pass fix_unicode=true at the top level, not when diff_main is
    // recursively invoked
    return diff_main(text1, text2, cursor_pos, true);
  }

  diff.INSERT = DIFF_INSERT;
  diff.DELETE = DIFF_DELETE;
  diff.EQUAL = DIFF_EQUAL;

  var diff_1 = diff;

  const diffDOM = new DiffDOM;
  const diffStr = diff_1;

  function htmlDiff(from, to) {
    from = `<div>${from}</div>`;
    to = `<div>${to}</div>`;
    let diff = diffDOM.diff(from, to);
    let fromNode = stringToObj(from);
    let toNode = stringToObj(to);
    let cloneNode = _.cloneDeep(toNode);
    if (!cloneNode.childNodes) {
      cloneNode.childNodes = [];
    }
    let rmArr = [];

    console.log('diff', diff);

    diff.forEach(d => {
      if (d.action === 'modifyTextElement') {
        let s = diffStr(d.oldValue, d.newValue);
        let c = getFromVirtualRoute$1(cloneNode, d.route);
        let newNodes = s.map(item => {
          if (item[0] === 0) {
            return spanObj({
              class: 'equal',
              text: item[1]
            })
          } else if (item[0] === 1) {
            return spanObj({
              class: 'insert',
              text: item[1]
            })
          } else if (item[0] === -1) {
            return spanObj({
              class: 'delete',
              text: item[1]
            })
          }
        });
        c.parentNode.childNodes = newNodes;
      } else if (d.action === 'addElement') {
        let c = getFromVirtualRoute$1(cloneNode, d.route);
        insertAttribute(c.node, {
          class: 'insert'
        });
      } else if (d.action === 'removeElement') {
        let pRoute = d.route.slice(0, d.route.length - 1);
        let c = getFromVirtualRoute$1(fromNode, d.route);
        let p = getFromVirtualRoute$1(cloneNode, pRoute).node;

        if (c.node.nodeName === 'IMG') {
          insertAttribute(p, {
            class: 'delete'
          });
          rmArr.push({
            node: _.cloneDeep(d.element),
            parentNode: p,
            idx: c.nodeIndex
          });
        } else {
          insertAttribute(d.element, {
            class: 'delete'
          });
          rmArr.push({
            node: _.cloneDeep(d.element),
            parentNode: p,
            idx: c.nodeIndex
          });
        }
      } else if (d.action === 'removeTextElement') {
        let pRoute = d.route.slice(0, d.route.length - 1);
        let c = getFromVirtualRoute$1(fromNode, d.route);
        let p = getFromVirtualRoute$1(cloneNode, pRoute).node;

        let node = spanObj({
          class: 'delete',
          text: d.value
        });

        rmArr.push({
          node: node,
          parentNode: p,
          idx: c.nodeIndex
        });
      } else if (d.action === 'modifyAttribute' && d.name === 'style') {
        let c = getFromVirtualRoute$1(cloneNode, d.route);

        insertAttribute(c.node, {
          class: 'style'
        });
      } else if (d.action === 'removeAttribute' && d.name === 'style') {
        let c = getFromVirtualRoute$1(cloneNode, d.route);

        insertAttribute(c.node, {
          class: 'style'
        });
      }
    });
    rmArr.forEach(item => {
      if (!item.parentNode.childNodes) {
        item.parentNode.childNodes = [];
      }
      item.parentNode.childNodes.splice(item.idx, 0, item.node);
    });
    let resultNode = objToNode$1(cloneNode, false, {
      document: document
    });
    return resultNode.innerHTML
  }

  function objToNode$1(objNode, insideSvg, options) {
    let node;
    if (objNode.nodeName === '#text') {
      node = options.document.createTextNode(objNode.data);

    } else if (objNode.nodeName === '#comment') {
      node = options.document.createComment(objNode.data);
    } else {
      if (objNode.nodeName === 'svg' || insideSvg) {
        node = options.document.createElementNS('http://www.w3.org/2000/svg', objNode.nodeName);
        insideSvg = true;
      } else {
        node = options.document.createElement(objNode.nodeName);
      }
      if (objNode.attributes) {
        Object.entries(objNode.attributes).forEach(([key, value]) => node.setAttribute(key, value));
      }
      if (objNode.childNodes) {
        objNode.childNodes.forEach(childNode => node.appendChild(objToNode$1(childNode, insideSvg, options)));
      }
      if (options.valueDiffing) {
        if (objNode.value) {
          node.value = objNode.value;
        }
        if (objNode.checked) {
          node.checked = objNode.checked;
        }
        if (objNode.selected) {
          node.selected = objNode.selected;
        }
      }
    }
    return node
  }

  function getFromVirtualRoute$1(tree, route) {
    let node = tree;
    let parentNode;
    let nodeIndex;

    route = route.slice();
    while (route.length > 0) {
      if (!node.childNodes) {
        return false
      }
      nodeIndex = route.splice(0, 1)[0];
      parentNode = node;
      node = node.childNodes[nodeIndex];
    }
    return {
      node,
      parentNode,
      nodeIndex
    }
  }

  function spanObj (opts) {
    return {
      nodeName: 'span',
      attributes: {
        class: opts.class || ''
      },
      childNodes: [
        {
          nodeName: '#text',
          data: opts.text
        }
      ]
    }
  }

  function insertAttribute (node, attr) {
    if (node.attributes) {
      Object.keys(attr).forEach(key => {
        if (node.attributes.hasOwnProperty(key)) {
          if (node.attributes[key].indexOf(attr[key]) === -1) {
            node.attributes[key] += ` ${attr[key]}`;
          }
        } else {
          node.attributes[key] = `${attr[key]}`;
        }
      });
    } else {
      node.attributes = attr;
    }
  }

  exports.default = htmlDiff;
  exports.htmlDiff = htmlDiff;
  exports.objToNode = objToNode$1;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
