import _ from 'lodash';
import * as d3 from 'd3';

const parseTime = d3.timeParse('%Y/%m/%d %H:%M:%S %Z');

// function isCutEdge(l, nodes, linkedByIndex, maxDepth) {
//   var tgt = nodes[l.target];
//   var targetDeg = outLinks(tgt, nodes, linkedByIndex).length;
//   return l.level % maxDepth === 0 && targetDeg > 0;
// }
//

function nbsByTag(a, linkedByIndex, nodes, seen) {
  const nbs = [];
  for (const property in linkedByIndex) {
    const s = property.split(',').map(d => parseInt(d));
    const source = nodes[s[0]];
    const target = nodes[s[1]];
    let diff;
    let interset;

    if (s[0] === a) {
      diff = _.difference(source.sets, seen);
      interset = _.intersection(diff, target.sets);
      if (interset.length > 0) {
        nbs.push(s[1]);
      }
    }
  }
  return _.uniq(nbs);
}

function connectionsIndex(a, linkedByIndex, nodes) {
  let connections = 0;
  let nb;
  for (const property in linkedByIndex) {
    const s = property.split(',').map(d => parseInt(d));
    if (s[0] === a && nodes[s[1]]) {
      nb = nodes[s[1]];
      // console.log("nb", nb);
      connections += nb.nodes.length;
    } else if (s[1] === a && nodes[s[0]]) {
      nb = nodes[s[0]];
      // console.log("nb", nb);
      connections += nb.nodes.length;
    }
  }
  return connections;
}

function extractSets(data) {
  const copyData = data.map(d => d);
  console.log('copyData', copyData);
  // console.log("copyData", copyData);
  // var oldSets = null; //this._sets, //foci.sets() ,

  const sets = d3.map({}, d => d.__key__);

  let individualSets = d3.map(),
    set,
    key,
    i,
    n = copyData.length;

  // TODO: rename __key__
  for (i = -1; ++i < n; ) {
    // TODO: change it later, too specific
    set = copyData[i].tags;
    console.log('set', copyData[i]);
    if (!set) continue;
    key = set.sort().join(',');
    if (set.length) {
      set.forEach(val => {
        if (individualSets.get(val)) {
          individualSets.get(val).size += 1;
        } else {
          individualSets.set(val, {
            __key__: val,
            size: 1,
            sets: [val],
            nodes: []
          });
        }
      });
      copyData[i].__setKey__ = key;
      if (sets.get(key)) {
        const e = sets.get(key);
        e.size++;
        e.nodes.push(copyData[i]);
      } else {
        sets.set(key, {
          __key__: key,
          sets: set,
          size: 1,
          nodes: [copyData[i]]
        });
      }
    }
  }

  individualSets.each((v, k) => {
    if (!sets.get(k)) {
      sets.set(k, v);
    }
  });

  return sets;
}

function initSets(data, startTag) {
  data.forEach(d => (d.date = parseTime(d.created_at)));
  return extractSets(data);

  // this._bicomps = bicomps.map(g => g.map(i => setData[i]));
  // this._cutEdges = graph.edges.filter(l => {
  //   console.log("lINk", l);
  //   console.log("nodeCount", l.nodeCount);
  //   return l.level % this._maxDepth === 0;
  // });
}

function prepareGraph(setData, startTag) {
  // if (!data) return this._sets;

  // TODO: filter out before
  const nodes = setData.filter(v => v.nodes.length > 0);

  nodes.forEach((d, i) => {
    d.level = 0;
    d.index = i;
  });

  const fociLinks = [];
  nodes.forEach(s => {
    nodes.forEach(t => {
      const interSet = _.intersection(s.sets, t.sets);
      // var linkExist = fociLinks.findIndex(l => (
      //   l.source === s.index && l.target === t.index || l.target === s.index && l.source === t.index)) === -1 ? false : true;

      if (s.index !== t.index && interSet.length > 0) {
        fociLinks.push({
          source: s.index,
          target: t.index,
          interSet,
          strength: t.sets.length / s.sets.length
        });
      }
    });
  });

  // console.log("foci nodes", nodes);
  // console.log("fociLinks", fociLinks);
  // console.log("fociLinks length", fociLinks.length);

  const linkedByIndex = {};
  fociLinks.forEach(d => {
    const src = d.source.index ? d.source.index : d.source;
    const tgt = d.target.index ? d.target.index : d.target;
    linkedByIndex[`${src},${tgt}`] = true;
  });

  // console.log("linkedByIndex", linkedByIndex);

  // TODO
  // this._linkedByIndex = linkedByIndex;

  // TODO: do more testing
  return forest(nodes, linkedByIndex, startTag);
  // return {nodes: nodes, edges: fociLinks};

  function forest(nodes, linkedByIndex, startTag) {
    function graphToDAG(startIndex) {
      const G = {
        nodes: [],
        vertices: [],
        edges: []
      };
      let q = [];
      let counter = 0;
      const visitedTags = [];
      let level = 1;
      let nodeCount = 0;

      q.push(startIndex);
      G.vertices.push(startIndex);

      const startNode = nodes[startIndex];

      startNode.level = level;
      const sets = [];
      // level += 1;
      // console.log("startLevel", startNode.level);

      G.nodes.push(startNode);

      // console.log("startIndex", startIndex);

      while (q.length !== 0) {
        // console.log("q", q);
        const u = q.pop(); // pop front

        // console.log("u index", u);
        // console.log("u", nodes[u]);
        // console.log("seen", tags);
        // console.log("sets", nodes[u].sets);
        // console.log("diff", _.difference(nodes[u].sets, tags));
        const vs = nbsByTag(u, linkedByIndex, nodes, visitedTags);

        const sorted = _.sortBy(
          vs.map(i => nodes[i]),
          d =>
            // const conn = connectionsIndex(d.index, linkedByIndex, sv.map(i => nodes[i]));
            // return 100 * conn * d.nodes.length / d.sets.length;
            // TODO: check later
            d.sets.includes('d3') ? 1 : 0
        ).map(d => d.index);

        // console.log("vs", sorted.map(u => nodes[u].__key__));

        // console.log("sorted", sorted.map(i => nodes[i]));

        sorted.forEach(v => {
          if (G.vertices.indexOf(v) !== -1) {
            const filterOut = G.edges.filter(
              l =>
                // var tgtNode = nodes[l.target];
                // console.log("tgtNodes", tgtNodes);
                l.target === v // && tgtNode.nodes.length > 1;
            );

            G.edges = _.difference(G.edges, filterOut);
            // if (counter % 10 != 0) {
            G.edges.push({
              source: u,
              target: v,
              nodeCount,
              counter,
              interSet: _.intersection(nodes[u].sets, nodes[v].sets),
              level,
              strength: nodes[v].sets.length / nodes[u].sets.length,
              visitedTags
            });
            counter++;
            // }
          } else {
            G.vertices.push(v);
            const node = nodes[v];
            node.level = level;
            node.number = counter;
            nodeCount += node.nodes.length;
            node.count = nodeCount;
            node.seen = visitedTags;
            G.nodes.push(node);

            // if (counter % 10 !== 0) {
            G.edges.push({
              source: u,
              target: v,
              interSet: _.intersection(nodes[u].sets, nodes[v].sets),
              level,
              counter,
              nodeCount,
              strength: nodes[v].sets.length / nodes[u].sets.length,
              visitedTags
            });
            // }
            counter++;
            q.push(v);

            q = _.uniq(q);
            q = _.sortBy(q.map(i => nodes[i]), d => d.sets.length)
              .map(d => d.index)
              .reverse();
          }
        });
        level += 1;
        visitedTags.push(...nodes[u].sets);
      }
      // console.log('nodes', nodes);
      G.nodes = G.edges.reduce((acc, e, i) => {
        const src = nodes[e.source];
        const tgt = nodes[e.target];
        // console.log('src', src);
        // console.log('tgt', tgt);
        if (acc.find(n => src.__key__ === n.__key__) === undefined) {
          return acc.concat([src]);
        }
        if (acc.find(n => tgt.__key__ === n.__key__) === undefined) {
          return acc.concat([tgt]);
        }
        return acc;
      }, []);
      G.nodes.forEach((e, i) => (e.index = i));
      G.edges = G.edges.map(e => {
        e.source = nodes[e.source].index;
        e.target = nodes[e.target].index;
        return e;
      });
      G.vertices = G.nodes.map(e => e.index);
      return G;
    }

    const sortedNodes = _.sortBy(
      nodes,
      d =>
        // console.log("d.index", d.index);
        // var conn = connectionsIndex(d.index, linkedByIndex, nodes);
        // return conn * d.nodes.length;
        d.sets.length
    ).reverse();

    // console.log('sortedNodes', sortedNodes);

    const startNode = sortedNodes.find(n => n.sets.includes(startTag));
    console.log('startNode', startNode);

    let edges = [];
    let newNodes = [];
    let sv = [startNode];
    while (sv.length > 0) {
      const st = sv.pop();
      const G = graphToDAG(st.index, nodes);
      console.log('Graph', G);
      console.log('G.nodes', G.vertices);
      console.log('sv', sv);
      sv = _.difference(sv, G.vertices);
      console.log('diff', sv);
      edges = edges.concat(G.edges);
      newNodes = newNodes.concat(G.nodes);
    }

    // newNodes = _.sortBy(newNodes, d => d.index);
    console.log('G nodes', newNodes);

    const spreadNodes = _.flattenDeep(
      newNodes.map(d =>
        d.nodes.map(n =>
          n.tags.map(t => {
            const copy = _.clone(n);
            copy.key = t;
            return copy;
          })
        )
      )
    );

    const allTags = d3
      .nest()
      .key(d => d.key)
      .entries(spreadNodes)
      .sort((a, b) => d3.descending(a.values.length, b.values.length));

    return {
      nodes,
      edges,
      linkedByIndex,
      tags: allTags
    };
  }
}
export default initSets;



// WEBPACK FOOTER //
// ./src/components/Bookmarks/tagGraph.js