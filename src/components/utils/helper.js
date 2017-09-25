import * as d3 from 'd3';

function bbox(nodes, w, h) {
  return function() {
    for (let i = 0, n = nodes.length; i < n; ++i) {
      const node = nodes[i];
      node.x = Math.max(node.r, Math.min(w - node.r, node.x));
      node.y = Math.max(node.r, Math.min(h - node.r, node.y));
    }
  };
}

// function checkBounds(nodes, width, height, padBottom = 0, padLeft = 0, strength = 1) {
//   return function() {
//     for (let i = 0, n = nodes.length; i < n; ++i) {
//       // fix
//       const node = nodes[i];
//       const halfHeight = node.height / 2;
//       const halfWidth = node.width / 2;
//       if ((node.x + node.vx) - halfWidth < padLeft) {
//         node.vx = halfWidth * strength;
//       }
//       if ((node.x + node.vx) + halfWidth > width) {
//         node.vx = width - (halfWidth * strength);
//       }
//
//       if ((node.y + node.vy) - halfHeight < padBottom) {
//         node.vy = halfHeight + (padBottom * strength);
//       }
//       if ((node.y + node.vy) + halfHeight > height) {
//         node.vy = height - (halfHeight * strength);
//       }
//     }
//   };
// }
function forceContainer(bbox) {
  let nodes;
  let strength = () => 0.4;
  const padX = 0;
  const padY = 0;
  let width = a => Math.abs(a.offsetCornerX + a.offsetCornerX + padX);
  let height = a => Math.abs(a.offsetCornerY + a.offsetCornerY + a.height);
  let iterations = 1;

  if (!bbox || bbox.length < 2) bbox = [[0, 0], [100, 100]];

  function force(alpha) {
    let i;
    let j;
    const n = nodes.length;
    // alpha = 1;

    for (j = 0; j < iterations; ++j) {
      for (i = 0; i < n; ++i) {
        const node = nodes[i];
        const x = node.x;
        const y = node.y;

        const w = width(node);
        const h = height(node);
        // console.log('height', h);
        // console.log('w', w, 'h', h);

        const pow = (isNaN(strength) ? strength(node) : strength) / 10;

        if (x - w / 2 < bbox[0][0]) {
          const dist = Math.abs(-w / 2);
          node.vx += bbox[0][0] + (x + dist) * (alpha * pow);
          // node.x = bbox[0][0] + (x + w / 2);
        }
        if (y - h / 2 < bbox[0][1]) {
          const dist = Math.abs(h / 2);
          node.vy += (bbox[0][1] + (y + dist)) * (alpha * pow);
          // node.y = bbox[0][1] - (y - h / 2);
        }
        if (x + w / 2 > bbox[1][0]) {
          const dist = Math.abs(x + w / 2);
          node.vx += (bbox[1][0] - (x + dist)) * (alpha * pow);
          // node.y = bbox[1][1] - w / 2;
        }
        if (y + h / 2 > bbox[1][1]) {
          const dist = h / 2;
          node.vy += (bbox[1][1] - (y + dist)) * (alpha * pow);
          // node.y = bbox[1][1] - h / 2;
        }
      }
    }
  }

  force.initialize = function(_) {
    nodes = _;
  };

  force.width = function(_) {
    return arguments.length ? ((width = _), force) : width;
  };

  force.height = function(_) {
    return arguments.length ? ((height = _), force) : height;
  };

  force.bbox = function(_) {
    return arguments.length ? ((bbox = +_), force) : bbox;
  };
  force.strength = function(_) {
    return arguments.length ? ((strength = _), force) : strength;
  };
  force.iterations = function(_) {
    return arguments.length ? ((iterations = _), force) : iterations;
  };

  return force;
}

function forceContainerStrict(bbox) {
  let nodes;
  let strength = () => 0.4;
  let width = d => d.width;
  let height = d => d.height;

  if (!bbox || bbox.length < 2) bbox = [[0, 0], [100, 100]];

  function force(alpha) {
    let i;
    const n = nodes.length;
    // alpha = 1;
    const iterations = 20;

    for (i = 0; i < iterations; ++i) {
      for (i = 0; i < n; ++i) {
        const node = nodes[i];
        const x = node.x;
        const y = node.y;
        const w = width(node);
        const h = height(node);

        if (x - w / 2 < bbox[0][0]) {
          node.x = bbox[0][0] + w / 2;
          node.vx = bbox[0][0] + w / 2;
          // node.x = bbox[0][0] + (x + w / 2);
        }
        if (y - h / 2 < bbox[0][1]) {
          node.y = bbox[0][1] + h / 2;
          node.vy = bbox[0][1] + h / 2;
          // node.y = bbox[0][1] - (y - h / 2);
        }
        if (x + w / 2 > bbox[1][0]) {
          node.x = bbox[1][0] - w / 2;
          node.vx = bbox[1][0] - w / 2;
          // node.y = bbox[1][1] - w / 2;
        }
        if (y + h / 2 > bbox[1][1]) {
          node.y = bbox[1][1] - h / 2;
          node.vy = bbox[1][1] - h / 2;
          // node.y = bbox[1][1] - h / 2;
        }
      }
    }
  }

  force.initialize = function(_) {
    nodes = _;
  };

  force.width = function(_) {
    return arguments.length ? ((width = +_), force) : width;
  };

  force.height = function(_) {
    return arguments.length ? ((height = +_), force) : height;
  };

  force.bbox = function(_) {
    return arguments.length ? ((bbox = +_), force) : bbox;
  };
  force.strength = function(_) {
    return arguments.length ? ((strength = _), force) : strength;
  };

  return force;
}

function forceContainer(bbox) {
  let nodes;
  let strength = () => 0.4;

  const padX = 0;
  // const padY = 0;
  // let width = a => Math.abs(a.offsetCornerX + a.offsetCornerX + padX);
  // let height = a => Math.abs(a.offsetCornerY + a.offsetCornerY + a.height);
  let width = a => a.width;
  let height = a => a.height;
  let iterations = 1;

  if (!bbox || bbox.length < 2) bbox = [[0, 0], [100, 100]];

  function force(alpha) {
    let i;
    let j;
    const n = nodes.length;
    // alpha = 1;

    for (j = 0; j < iterations; ++j) {
      for (i = 0; i < n; ++i) {
        const node = nodes[i];
        const x = node.x;
        const y = node.y;

        const w = width(node);
        const h = height(node);
        // console.log('height', h);
        // console.log('w', w, 'h', h);

        const pow = (isNaN(strength) ? strength(node) : strength) / 10;

        if (x - w / 2 < bbox[0][0]) {
          const dist = Math.abs(-w / 2);
          node.vx += bbox[0][0] + (x + dist) * (alpha * pow);
          // node.x = bbox[0][0] + (x + w / 2);
        }
        if (y - h < bbox[0][1]) {
          const dist = Math.abs(h);
          node.vy += (bbox[0][1] + (y + dist)) * (alpha * pow);
          // node.y = bbox[0][1] - (y - h / 2);
        }
        if (x + w / 2 > bbox[1][0]) {
          const dist = Math.abs(x + w / 2);
          node.vx += (bbox[1][0] - (x + dist)) * (alpha * pow);
          // node.y = bbox[1][1] - w / 2;
        }
        if (y + h > bbox[1][1]) {
          const dist = h;
          node.vy += (bbox[1][1] - (y + dist)) * (alpha * pow);
          // node.y = bbox[1][1] - h / 2;
        }
      }
    }
  }

  force.initialize = function(_) {
    nodes = _;
  };

  force.width = function(_) {
    return arguments.length ? ((width = _), force) : width;
  };

  force.height = function(_) {
    return arguments.length ? ((height = _), force) : height;
  };

  force.bbox = function(_) {
    return arguments.length ? ((bbox = +_), force) : bbox;
  };
  force.strength = function(_) {
    return arguments.length ? ((strength = _), force) : strength;
  };
  force.iterations = function(_) {
    return arguments.length ? ((iterations = _), force) : iterations;
  };

  return force;
}

// function forceContainer(bbox) {
//   let nodes;
//   let strength = 1;
//
//   // if (!bbox || bbox.length < 2) bbox = [[0, 0], [100, 100]];
//
//
//   function force(alpha) {
//     let i,
//       n = nodes.length,
//       node,
//       x = 0,
//       y = 0;
//
//     if (strength) {
//       for (i = 0; i < n; ++i) {
//         node = nodes[i], x = node.x, y = node.y;
//
//         if (typeof strength === 'function') strength = strength(node);
//
//         const halfHeight = node.height;
//         const halfWidth = node.width;
//
//         if ((x - halfWidth) < bbox[0][0]) node.vx += (bbox[0][0] - x) * (alpha * strength);
//         if ((y - halfHeight) < bbox[0][1]) node.vy += (bbox[0][1] - y - halfHeight) * (alpha * strength);
//         if ((x + halfWidth) > bbox[1][0]) node.vx += (bbox[1][0] - x - halfWidth) * (alpha * strength);
//         if ((y + halfHeight) > bbox[1][1]) node.vy += (bbox[1][1] - y - halfHeight) * (alpha * strength);
//       }
//     }
//   }
//
//   force.initialize = function(_) {
//     nodes = _;
//   };
//
//   force.bbox = function(_) {
//     return arguments.length ? (bbox = +_, force) : bbox;
//   };
//   force.strength = function(_) {
//     return arguments.length ? (strength = +_, force) : strength;
//   };
//
//   return force;
// }

function rectCollide(nodes, strength) {
  return function(alpha) {
    const quadtree = d3
      .quadtree()
      .x(d => d.x)
      .y(d => d.y)
      .addAll(nodes);
    const padding = 6;

    for (let i = 0, n = nodes.length; i < n; ++i) {
      const node = nodes[i];
      quadtree.visit((quad, x1, y1, x2, y2) => {
        if (quad.data && quad.data !== node) {
          let x = node.x - quad.data.x;
          let y = node.y - quad.data.y;
          const xSpacing = (quad.data.width + node.width) / 2;
          const ySpacing = (quad.data.height + node.height + padding) / 2;
          const absX = Math.abs(x);
          const absY = Math.abs(y);
          let l;
          let lx;
          let ly;

          // console.log("Node quad", node.width, node.height);

          if (absX < xSpacing && absY < ySpacing) {
            l = Math.sqrt(x * x + y * y);

            lx = (absX - xSpacing) / l;
            ly = (absY - ySpacing) / l;

            // the one that"s barely within the bounds probably triggered the collision
            if (Math.abs(lx) > Math.abs(ly)) {
              lx = 0;
            } else {
              ly = 0;
            }

            x *= lx * alpha * strength;
            y *= ly * alpha * strength;
            console.log('x rect y', x, y, node.width, node.height);

            node.vx -= x;
            node.vy -= y;
            quad.data.vx += x;
            quad.data.vy += y;

            // updated = true;
          }
        }
      });
    }
  };
}

// function boundedBox() {
//   var nodes, sizes
//   var bounds
//   var size = constant([0, 0])
//
//   function force() {
//       var node, size
//       var xi, x0, x1, yi, y0, y1
//       var i = -1
//       while (++i < nodes.length) {
//           node = nodes[i]
//           size = sizes[i]
//           xi = node.x + node.vx
//           x0 = bounds[0][0] - xi
//           x1 = bounds[1][0] - (xi + size[0])
//           yi = node.y + node.vy
//           y0 = bounds[0][1] - yi
//           y1 = bounds[1][1] - (yi + size[1])
//           if (x0 > 0 || x1 < 0) {
//               node.x += node.vx
//               node.vx = -node.vx
//               if (node.vx < x0) { node.x += x0 - node.vx }
//               if (node.vx > x1) { node.x += x1 - node.vx }
//         }
//           if (y0 > 0 || y1 < 0) {
//               node.y += node.vy
//               node.vy = -node.vy
//               if (node.vy < y0) { node.vy += y0 - node.vy }
//               if (node.vy > y1) { node.vy += y1 - node.vy }
//         }
//       }
//     }
//   }
//
//   force.initialize = function(_) {
//       sizes = (nodes = _).map(size)
//   };
//
//   force.bounds = function (_) {
//       return (arguments.length ? (bounds = _, force) : bounds)
//   };
//
//   force.size = function (_) {
//       return (arguments.length
//       ? ((size = typeof _ === 'function' ? _ : constant(_)), force)
//       : size);
//   };
//   return force;
// }

function bboxCollide(bbox) {
  function x(d) {
    return d.x + d.vx;
  }

  function y(d) {
    return d.y + d.vy;
  }

  function constant(x) {
    return function() {
      return x;
    };
  }

  let nodes,
    boundingBoxes,
    strength = 1,
    iterations = 1;

  if (typeof bbox !== 'function') {
    bbox = constant(bbox === null ? [[0, 0][(1, 1)]] : bbox);
  }

  function force(alpha) {
    let i, tree, node, xi, yi, bbi, nx1, ny1, nx2, ny2;

    // if (alpha > 0.4) return;
    const cornerNodes = [];
    nodes.forEach((d, i) => {
      cornerNodes.push({
        node: d,
        vx: d.vx,
        vy: d.vy,
        x: d.x + (boundingBoxes[i][1][0] + boundingBoxes[i][0][0]) / 2,
        y: d.y + (boundingBoxes[i][0][1] + boundingBoxes[i][1][1]) / 2
      });
      cornerNodes.push({
        node: d,
        vx: d.vx,
        vy: d.vy,
        x: d.x + boundingBoxes[i][0][0],
        y: d.y + boundingBoxes[i][0][1]
      });
      cornerNodes.push({
        node: d,
        vx: d.vx,
        vy: d.vy,
        x: d.x + boundingBoxes[i][0][0],
        y: d.y + boundingBoxes[i][1][1]
      });
      cornerNodes.push({
        node: d,
        vx: d.vx,
        vy: d.vy,
        x: d.x + boundingBoxes[i][1][0],
        y: d.y + boundingBoxes[i][0][1]
      });
      cornerNodes.push({
        node: d,
        vx: d.vx,
        vy: d.vy,
        x: d.x + boundingBoxes[i][1][0],
        y: d.y + boundingBoxes[i][1][1]
      });
    });
    const cn = cornerNodes.length;

    for (let k = 0; k < iterations; ++k) {
      tree = d3.quadtree(cornerNodes, x, y).visitAfter(prepareCorners);

      for (i = 0; i < cn; ++i) {
        var nodeI = ~~(i / 5);
        node = nodes[nodeI];
        bbi = boundingBoxes[nodeI];
        xi = node.x + node.vx;
        yi = node.y + node.vy;
        nx1 = xi + bbi[0][0];
        ny1 = yi + bbi[0][1];
        nx2 = xi + bbi[1][0];
        ny2 = yi + bbi[1][1];
        tree.visit(apply);
      }
    }

    function apply(quad, x0, y0, x1, y1) {
      const data = quad.data;
      if (data) {
        let bWidth = bbLength(bbi, 0),
          bHeight = bbLength(bbi, 1);

        if (data.node.index !== nodeI) {
          const dataNode = data.node;
          let bbj = boundingBoxes[dataNode.index],
            dnx1 = dataNode.x + dataNode.vx + bbj[0][0],
            dny1 = dataNode.y + dataNode.vy + bbj[0][1],
            dnx2 = dataNode.x + dataNode.vx + bbj[1][0],
            dny2 = dataNode.y + dataNode.vy + bbj[1][1],
            dWidth = bbLength(bbj, 0),
            dHeight = bbLength(bbj, 1);

          if (nx1 <= dnx2 && dnx1 <= nx2 && ny1 <= dny2 && dny1 <= ny2) {
            const xSize = [
              Math.min.apply(null, [dnx1, dnx2, nx1, nx2]),
              Math.max.apply(null, [dnx1, dnx2, nx1, nx2])
            ];
            const ySize = [
              Math.min.apply(null, [dny1, dny2, ny1, ny2]),
              Math.max.apply(null, [dny1, dny2, ny1, ny2])
            ];

            const xOverlap = bWidth + dWidth - (xSize[1] - xSize[0]);
            const yOverlap = bHeight + dHeight - (ySize[1] - ySize[0]);

            const xBPush = xOverlap * strength * (yOverlap / bHeight);
            const yBPush = yOverlap * strength * (xOverlap / bWidth);

            const xDPush = xOverlap * strength * (yOverlap / dHeight);
            const yDPush = yOverlap * strength * (xOverlap / dWidth);

            if ((nx1 + nx2) / 2 < (dnx1 + dnx2) / 2) {
              node.vx -= xBPush;
              dataNode.vx += xDPush;
            } else {
              node.vx += xBPush;
              dataNode.vx -= xDPush;
            }
            if ((ny1 + ny2) / 2 < (dny1 + dny2) / 2) {
              node.vy -= yBPush;
              dataNode.vy += yDPush;
            } else {
              node.vy += yBPush;
              dataNode.vy -= yDPush;
            }
          }
        }
        return;
      }

      return x0 > nx2 || x1 < nx1 || y0 > ny2 || y1 < ny1;
    }
  }

  function prepareCorners(quad) {
    if (quad.data) {
      return (quad.bb = boundingBoxes[quad.data.node.index]);
    }
    quad.bb = [[0, 0], [0, 0]];
    for (let i = 0; i < 4; ++i) {
      if (quad[i] && quad[i].bb[0][0] < quad.bb[0][0]) {
        quad.bb[0][0] = quad[i].bb[0][0];
      }
      if (quad[i] && quad[i].bb[0][1] < quad.bb[0][1]) {
        quad.bb[0][1] = quad[i].bb[0][1];
      }
      if (quad[i] && quad[i].bb[1][0] > quad.bb[1][0]) {
        quad.bb[1][0] = quad[i].bb[1][0];
      }
      if (quad[i] && quad[i].bb[1][1] > quad.bb[1][1]) {
        quad.bb[1][1] = quad[i].bb[1][1];
      }
    }
  }

  function bbLength(bbox, heightWidth) {
    return bbox[1][heightWidth] - bbox[0][heightWidth];
  }

  force.initialize = function(_) {
    let i,
      n = (nodes = _).length;
    boundingBoxes = new Array(n);
    for (i = 0; i < n; ++i) boundingBoxes[i] = bbox(nodes[i], i, nodes);
  };

  force.iterations = function(_) {
    return arguments.length ? ((iterations = +_), force) : iterations;
  };

  force.strength = function(_) {
    return arguments.length ? ((strength = +_), force) : strength;
  };

  force.bbox = function(_) {
    return arguments.length
      ? ((bbox = typeof _ === 'function' ? _ : constant(+_)), force)
      : bbox;
  };

  return force;
}

export { bbox, forceContainer, bboxCollide, forceContainerStrict };
