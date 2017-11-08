import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import tsnejs from 'tsne';

import TSNE from 'tsne-js';
import _ from 'lodash';
import cola from 'webcola';
import ReactDOM from 'react-dom';

// import TSNE from 'tsne-js';
// import { bboxCollide } from '../utils/helper';

import { bboxCollide } from 'd3-bboxCollide';
import { forceSurface } from 'd3-force-surface';

import { Motion, spring } from 'react-motion';

import cx from './index.scss';

import offsetInterpolate from './polyOffset';

const jaccard = (a, b) =>
  a.length !== 0 && b.length !== 0
    ? 1 - _.intersection(a, b).length / _.union(a, b).length
    : 1;

const groupPath = function(nodes, offset = 1, docOffset = 12) {
  let fakePoints = [];
  nodes.forEach(element => {
    fakePoints = fakePoints.concat([
      // "0.7071" scale the sine and cosine of 45 degree for corner points.
      [element.x, element.y + offset],
      [element.x + 0.7071 * offset, element.y + 0.7071 * offset],
      [element.x + offset, element.y],
      [element.x + 0.7071 * offset, element.y - 0.7071 * offset],
      [element.x, element.y - offset],
      [element.x - 0.7071 * offset, element.y - 0.7071 * offset],
      [element.x - offset, element.y],
      [element.x - 0.7071 * offset, element.y + 0.7071 * offset]
    ]);
  });

  const hull = d3.polygonHull(fakePoints);
  if (hull === null) return null;
  return offsetInterpolate(docOffset)(hull.reverse());
};

const fakePoints = function(nodes, offset = 1, docOffset = 12) {
  let fakePoints = [];
  nodes.forEach(element => {
    fakePoints = fakePoints.concat([
      // "0.7071" scale the sine and cosine of 45 degree for corner points.
      [element.x, element.y + offset],
      [element.x + 0.7071 * offset, element.y + 0.7071 * offset],
      [element.x + offset, element.y],
      [element.x + 0.7071 * offset, element.y - 0.7071 * offset],
      [element.x, element.y - offset],
      [element.x - 0.7071 * offset, element.y - 0.7071 * offset],
      [element.x - offset, element.y],
      [element.x - 0.7071 * offset, element.y + 0.7071 * offset]
    ]);
  });
  return fakePoints;
};

// const SetHull = class SetHull extends Component {
//   static propTypes = {
//     data: PropTypes.array,
//     size: PropTypes.number,
//     zoomHandler: PropTypes.func
//   };
//
//   constructor(props) {
//     super(props);
//     this.state = { w: 0, h: 0, cx: 0, cy: 0 };
//   }
//
//   componentDidMount() {
//     const { width, height, x, y } = ReactDOM.findDOMNode(this).getBBox();
//
//     // console.log('bbox', ReactDOM.findDOMNode(this).getBBox());
//     const cx = x + width / 2;
//     const cy = y + height / 2;
//     // const cx = (x + x + width) / 2;
//     // const cy = (y + y + height) / 2;
//     this.setState({ w: width, h: height, cx, cy });
//   }
//
//   render() {
//     const { data, size, zoomHandler } = this.props;
//     const { width, height, cx, cy } = this.state;
//     return (
//       <g>
//         <path
//           fill="white"
//           opacity={0.1}
//           d={groupPath(data, 1, size)}
//           stroke="black"
//           strokeWidth="1"
//           strokeLinecap="round"
//           onMouseOver={() => console.log('yeah')}
//           onClick={() => {
//             console.log('click');
//             zoomHandler({
//               left: cx,
//               top: cy,
//               docWidth: size,
//               docHeight: size
//             });
//           }}
//         />
//       </g>
//     );
//   }
// };

function runTsne(nodes, dists, bbox) {
  const width = bbox[1].to.x - bbox[0].from.x;
  const height = bbox[1].to.y - bbox[0].from.y;

  const model = new tsnejs.tSNE({
    dim: 2,
    perplexity: 50,
    epsilon: 20
  });

  // initialize data with pairwise distances
  model.initDataDist(dists);

  for (let i = 0; i < 300; ++i) model.step();

  // Y is an array of 2-D points that you can plot
  const pos = model.getSolution();

  // const strength = 1;
  nodes.forEach((d, i) => {
    d.pos = pos[i];
  });

  return nodes.map(d => {
    d.tsne = {
      x: 0, // centerx(pos[i][0]),
      y: 0, // centery(pos[i][1]) // d.y
      pos: d.pos
    };
    d.x = width / 2;
    d.y = height / 2;
    return d;
  });
}

function runColaForce(nodes, links, width, height) {
  const d3cola = cola
    .d3adaptor()
    .avoidOverlaps(true)
    .size([width, height]);

  d3cola
    .nodes(nodes)
    .links(links)
    .flowLayout('y', 200)
    .symmetricDiffLinkLengths(7)
    .start(30, 20, 50);

  const n = 200;
  for (let i = 0; i < n; ++i) d3cola.tick();
  d3cola.stop();

  return nodes.map(d => {
    // TODO: rename
    d.cola = {
      x: d.x,
      y: d.y
    };
    return d;
  });
}

function runCluster(nodes, links, themeGraph, width, height) {
  themeGraph.nodes.forEach(d => {
    d.width = 60;
    d.height = 60;
  });
  const clusterNodes = runColaForce(
    themeGraph.nodes,
    themeGraph.links,
    width,
    height
  );

  const resNodes = nodes.map(n => {
    const themeId = n.parents[0];
    const clusterNode = clusterNodes.find(
      c => c.id === themeId || c.id === n.themes[0]
    );
    // if (!clusterNode) console.log('clusterNode not found', n);
    n.cluster = { x: clusterNode.x, y: clusterNode.y };
    return n;
  });

  return resNodes;

  // console.log(;;
  //   'mappedCl',
  //   d3
  //     .nest();
  //     .key(d => d.id)
  //     .entries(mappedCl)
  // );
}

// import getSets from './tagGraph';
// import rawBookmarks from './diigo.json';

// import iconStyle from './styles/fileicon.css';

// function getRandomInt(min, max) {
//   return Math.floor(Math.random() * (max - (min + 1))) + min;
// }
// function _addWheelListener(elem, eventName, callback, useCapture) {
//   elem[_addEventListener](
//     prefix + eventName,
//     support == 'wheel'
//       ? callback
//       : originalEvent => {
//           !originalEvent && (originalEvent = window.event);
//
//           // create a normalized event object
//           const event = {
//           // keep a ref to the original event object
//             originalEvent,
//             target: originalEvent.target || originalEvent.srcElement,
//             type: 'wheel',
//             deltaMode: originalEvent.type == 'MozMousePixelScroll' ? 0 : 1,
//           deltaX: 0,
//             deltaZ: 0,
//             preventDefault: function() {
//               originalEvent.preventDefault
//                 ? originalEvent.preventDefault()
//                 : (originalEvent.returnValue = false);
//             }
//         };
//
//           // calculate deltaY (and deltaX) according to the event
//           if (support == 'mousewheel') {
//             event.deltaY = -1 / 40 * originalEvent.wheelDelta;
//             // Webkit also support wheelDeltaX
//             originalEvent.wheelDeltaX &&
//               (event.deltaX = -1 / 40 * originalEvent.wheelDeltaX);
//           } else {
//             event.deltaY = originalEvent.detail;
//         }
//
//           // it's time to fire the callback
//           return callback(event);
//       },
//     useCapture || false
//   );
// }
// function GestureZoomHandler(e) {
//   const elm = document.getElementById('subjects'); // document.body;
//   let newZoom = zoom * (e.scale / startScale);
//   startScale = e.scale;
//   if (newZoom < 0.067) newZoom = 0.067;
//   else if (newZoom > 4) newZoom = 4;
//   const delta = newZoom / zoom - 1;
//   if (newZoom != zoom) {
//     zoom = newZoom;
//     tx -=
//       (lastX + (window.scrollX || document.documentElement.scrollLeft) - tx) *
//       delta;
//     ty -=
//       (lastY + (window.scrollY || document.documentElement.scrollTop) - ty) *
//       delta;
//     if (zoom < 0.12) {
//       const f = (zoom - 0.067) / (0.12 - 0.067);
//       tx =
//         (window.innerWidth * 0.5 +
//           (window.scrollX || document.documentElement.scrollLeft) -
//           oldtx) *
//           (1 - f) +
//         tx * f;
//       ty =
//         (window.innerHeight * 0.5 +
//           (window.scrollY || document.documentElement.scrollTop) -
//           oldty) *
//           (1 - f) +
//         ty * f;
//     }
//     const transfromString = `matrix(${zoom},0,0,${zoom},${tx},${ty})`;
//     elm.style.webkitTransform = transfromString;
//     elm.style.MozTransform = transfromString;
//     elm.style.msTransform = transfromString;
//     elm.style.OTransform = transfromString;
//     elm.style.transform = transfromString;
//   }
//   document.getElementById('zoomslider').value = zoom * 1000;
//   e.preventDefault();
//   return false;
// }

class TagMap extends Component {
  static propTypes() {
    return {
      docWidth: React.PropTypes.array.isRequired,
      docHeight: React.PropTypes.array.isRequired,
      width: React.PropTypes.number.isRequired,
      height: React.PropTypes.number.isRequired
    };
  }

  constructor(props) {
    super(props);
    const { data, sets, width, height, docWidth, docHeight } = props;

    const padDocX = 10;
    const padDocY = 10;
    const padX = 0; // docWidth / 2;
    const padY = 0; // docHeight / 2;
    const inputData = data.map(d => {
      d.width = docWidth + padDocX;
      d.height = docHeight + padDocY;
      d.x = width / 2;
      d.y = height / 2;
      d.setIndex = sets.findIndex(
        e => e.values.findIndex(v => v.url === d.url) !== -1
      );
      return d;
    });

    const bbox = [
      {
        from: { x: padX, y: padY },
        to: { x: padX, y: height - padY }
      },
      {
        from: { x: padX, y: height - padY },
        to: { x: width - padX, y: height - padY }
      },
      {
        from: { x: width - padX, y: height - padY },
        to: { x: width - padX, y: padY }
      },
      {
        from: { x: width - padX, y: padY },
        to: { x: padX, y: padY }
      }
    ];

    const dists = inputData.map(a => data.map(b => jaccard(a.tags, b.tags)));
    // const nodes = runTsne(inputData, dists, bbox, docHeight);
    // const model = new TSNE({
    //   dim: 2,
    //   perplexity: 30.0,
    //   earlyExaggeration: 4.0,
    //   learningRate: 100.0,
    //   nIter: 500,
    //   metric: 'dice'
    // });
    //
    // // inputData is a nested array which can be converted into an ndarray
    // // alternatively, it can be an array of coordinates (second argument should be specified as 'sparse')
    // model.init({
    //   data: dists,
    //   type: 'dense'
    // });
    //
    // // `error`,  `iter`: final error and iteration number
    // // note: computation-heavy action happens here
    // const [run, iter] = model.run();
    // console.log('error', run, iter);
    // const output = model.getOutput();
    //
    // const nodes = inputData.map((d, i) => {
    //   d.tsne = { pos: output[i], x: 0, y: 0 };
    //   return d;
    // });
    // console.log('output', output);

    const model = new tsnejs.tSNE({
      dim: 2,
      perplexity: 50,
      epsilon: 20
    });

    // initialize data with pairwise distances
    model.initDataDist(dists);

    for (let i = 0; i < 400; ++i) model.step();

    // Y is an array of 2-D points that you can plot
    const output = model.getSolution();

    // const strength = 1;
    const nodes = inputData.map((d, i) => {
      d.tsne = {
        pos: output[i]
      };
      d.x = width / 2;
      d.y = height / 2;
      return d;
    });

    nodes.map(d => d);

    this.state = { nodes, bbox };

    // bbox,
    // nodes: sim.nodes()
  }

  // compNewState(props) {
  //   const {
  //     data,
  //     links,
  //     width,
  //     height,
  //     docWidth,
  //     docHeight,
  //     sets,
  //     // themeGraph,
  //     attr
  //   } = props;
  //
  //   // TODO: fix later
  //   if (data.length === 0) {
  //     return {
  //       dists: [],
  //       bbox: [],
  //       nodes: []
  //     };
  //   }
  //
  //   const padDocX = 10;
  //   const padDocY = 10;
  //
  //   const padX = 0; // docWidth / 2;
  //   const padY = 0; // docHeight / 2;
  //   const bbox = [
  //     {
  //       from: { x: padX, y: padY },
  //       to: { x: padX, y: height - padY }
  //     },
  //     {
  //       from: { x: padX, y: height - padY },
  //       to: { x: width - padX, y: height - padY }
  //     },
  //     {
  //       from: { x: width - padX, y: height - padY },
  //       to: { x: width - padX, y: padY }
  //     },
  //     {
  //       from: { x: width - padX, y: padY },
  //       to: { x: padX, y: padY }
  //     }
  //   ];
  //
  //   const dists = data.map(a => data.map(b => jaccard(a.tags, b.tags)));
  //
  //   // const newNodes = runColaForce(nodes, links, width, height);
  //   const nextNodes = runTsne(nodes, links, dists, bbox, docHeight);
  //
  //   // const nextNextNodes = runCluster(
  //   //   nextNodes,
  //   //   links,
  //   //   themeGraph,
  //   //   width,
  //   //   height
  //   // );
  //
  //   const pad = 5;
  //   const sim = d3
  //     .forceSimulation(nextNodes)
  //     .force(
  //       'link',
  //       d3
  //         .forceLink(links)
  //         .distance(200)
  //         .strength(1)
  //     )
  //     .force(
  //       'collide',
  //       d3
  //         .forceCollide()
  //         .radius(docHeight / 2 + pad)
  //         .strength(0.1)
  //     )
  //     // .force('charge', d3.forceManyBody())
  //     // .force('center', d3.forceCenter(width / 2, height / 2))
  //     .force('X', d3.forceX(d => d[attr].x).strength(1))
  //     .force('Y', d3.forceY(d => d[attr].y).strength(1))
  //     .force(
  //       'container',
  //       forceSurface()
  //         .elasticity(0)
  //         .surfaces(bbox)
  //         .oneWay(true)
  //         .radius(docHeight)
  //     )
  //     .stop();
  //   // .strength(0.01)
  //   // .on('end', () => {
  //   //   this.setState({ nodes: sim.nodes() });
  //   // });
  //
  //   for (let i = 0; i < 320; ++i) sim.tick();
  //   return {
  //     dists,
  //     bbox,
  //     nodes: sim.nodes()
  //   };
  // }
  componentWillReceiveProps(nextProps) {
    const { height, width, data, docHeight } = nextProps;
    const { nodes } = this.state;
    // TODO: make real check
    // const oldWidth = this.props.width;
    const oldHeight = this.props.height;

    if (height !== oldHeight || data.length !== this.props.data.length) {
      const padX = 0; // docWidth / 2;
      const padY = 0; // docHeight / 2;
      const bbox = [
        {
          from: { x: padX, y: padY },
          to: { x: padX, y: height - padY }
        },
        {
          from: { x: padX, y: height - padY },
          to: { x: width - padX, y: height - padY }
        },
        {
          from: { x: width - padX, y: height - padY },
          to: { x: width - padX, y: padY }
        },
        {
          from: { x: width - padX, y: padY },
          to: { x: padX, y: padY }
        }
      ];

      // const w = bbox[1].to.x - bbox[0].from.x;
      // const h = bbox[1].to.y - bbox[0].from.y;
      const centerx = d3.scaleLinear().range([bbox[0].from.x, bbox[1].to.x]);
      const centery = d3.scaleLinear().range([bbox[0].from.y, bbox[1].to.y]);
      const pos = nodes.map(d => d.tsne.pos);
      centerx.domain(d3.extent(pos.map(d => d[0])));
      centery.domain(d3.extent(pos.map(d => d[1])));

      const nextNodes = nodes.map((d, i) => {
        d.tx = centerx(pos[i][0]);
        d.ty = centery(pos[i][1]);
        return d;
      });

      const pad = 5;
      const sim = d3
        .forceSimulation(nextNodes)
        // .force(
        //   'link',
        //   d3
        //     .forceLink([])
        //     .distance(200)
        //     .strength(1)
        // )
        .force(
          'collide',
          d3
            .forceCollide()
            .radius(docHeight / 2 + pad)
            .strength(0.1)
        )
        // .force('charge', d3.forceManyBody())
        // .force('center', d3.forceCenter(width / 2, height / 2))
        .force('X', d3.forceX(d => d.tx).strength(1))
        .force('Y', d3.forceY(d => d.ty).strength(1))
        .force(
          'container',
          forceSurface()
            .elasticity(0)
            .surfaces(bbox)
            .oneWay(true)
            .radius(docHeight)
        );

      for (let i = 0; i < 320; ++i) sim.tick();

      this.setState({ nodes: nextNodes, bbox });
    }
  }

  render() {
    const { nodes } = this.state;
    const {
      width,
      height,
      docWidth,
      docHeight,
      color,
      sets,
      links,
      transform,
      zoomHandler,
      bubbleRadius,
      hoverHandler
    } = this.props;

    const Docs = nodes.map(d => (
      <Motion
        defaultStyle={{ left: width / 2, top: height / 2 }}
        style={{
          left: spring(d.x),
          top: spring(d.y)
        }}
      >
        {({ left, top }) => (
          <div
            key={d.id}
            style={{
              position: 'absolute',
              left: `${left - docWidth / 2}px`,
              top: `${top - docHeight / 2}px`,
              width: `${docHeight}px`,
              height: `${docWidth}px`,
              zIndex: 1000
            }}
            onMouseEnter={e => {
              hoverHandler({ left, top, doc: d });
            }}
            onMouseLeave={e => {
              hoverHandler(null);
            }}
          >
            <div
              style={{
                width: `${docHeight}px`,
                height: `${docWidth}px`,
                overflow: 'hidden',
                fontSize: '2px',
                // opacity: '0.4',
                border: '.1px solid grey',
                cursor: 'pointer'
              }}
              onClick={() => zoomHandler({ top, left, docWidth, docHeight })}
            >
              <div style={{ padding: '1px', height: '100%' }}>
                <div
                  style={{
                    opacity: '0.6',
                    background: 'white',
                    overflow: 'hidden',
                    height: '100%'
                  }}
                >
                  <span style={{ pointerEvents: 'none' }}>{d.title}</span>
                </div>
              </div>
            </div>
            {/* </div> */}
          </div>
        )}
      </Motion>
    ));

    // const SetHulls = sets.map(s => (
    //   <path
    //     fill="none"
    //     d={groupPath(s.values, 1, docHeight)}
    //     stroke="black"
    //     strokeWidth="1"
    //     strokeLinecap="round"
    //     onMouseOver={() => console.log('yeah')}
    //     onClick={() => zoomHandler({ top, left, docWidth, docHeight })}
    //   />
    // ));

    const Bubbles = sets.map(s => (
      <g
        key={s.id}
        style={{ filter: `url( "#gooeyCodeFilter-${s.key}")` }}
        onMouseOver={() => console.log('key', s.key)}
      >
        {s.values.map(d => {
          const n = nodes.find(e => e.title === d.title) || { x: 0, y: 0 };
          return (
            <Motion
              defaultStyle={{ left: width / 2, top: height / 2 }}
              style={{
                left: spring(n.x),
                top: spring(n.y)
              }}
            >
              {({ left, top }) => (
                <rect
                  fill={color(s.values.length)}
                  // opacity={0.9}
                  width={bubbleRadius}
                  height={bubbleRadius}
                  x={left - docHeight / 2}
                  y={top - docHeight / 2}
                />
              )}
            </Motion>
          );
        })}
      </g>
    ));

    const svgStyle = {
      // pointerEvents: 'none',
      width: '100%',
      height: '100%',
      position: 'absolute',
      left: 0,
      top: 0
    };

    return (
      <div ref={zoomCont => (this.zoomCont = zoomCont)}>
        <svg style={svgStyle}>
          <defs>
            {sets.map(s => (
              <filter id={`gooeyCodeFilter-${s.key}`}>
                <feGaussianBlur
                  in="SourceGraphic"
                  stdDeviation="5"
                  colorInterpolationFilters="sRGB"
                  result="blur"
                />
                <feColorMatrix
                  in="blur"
                  type="saturate"
                  values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${bubbleRadius} -6`}
                  result="gooey"
                />
              </filter>
            ))}
            <defs>
              {sets.map(s => (
                <filter id={`gooeyCodeFilter2-${s.key}`}>
                  <feGaussianBlur
                    in="SourceGraphic"
                    stdDeviation="10"
                    colorInterpolationFilters="sRGB"
                    result="blur"
                  />
                  <feColorMatrix
                    in="blur"
                    mode="matrix"
                    values={` 1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${bubbleRadius *
                      4} -7 `}
                    result="gooey"
                  />
                </filter>
              ))}
              <marker
                id="arrow"
                viewBox="0 -5 10 10"
                refX="5"
                refY="0"
                markerWidth="4"
                markerHeight="4"
                orient="auto"
              >
                <path d="M0,-5L10,0L0,5" className="arrowHead" stroke="grey" />
              </marker>
            </defs>
          </defs>
          <g>
            {sets.map(s => (
              <g>
                <path
                  className={cx.hull}
                  fill="white"
                  opacity={1}
                  d={groupPath(s.values, 1, docHeight)}
                  onMouseOver={() => console.log('yeah')}
                  onClick={() => {
                    const hull = d3.polygonHull(fakePoints(s.values));
                    const center = d3.polygonCentroid(hull);
                    zoomHandler({
                      left: center[0],
                      top: center[1],
                      docWidth: d3.polygonLength(hull),
                      docHeight: d3.polygonLength(hull)
                    });
                  }}
                />
              </g>
            ))}
          </g>
          <g>{Bubbles}</g>
        </svg>
        <div
          style={{
            width: `${width}px`,
            height: `${height}px`
            // border: 'black solid'
          }}
        >
          {Docs}
        </div>
      </div>
    );
  }
}

TagMap.defaultProps = {
  radius: 5,
  docWidth: 14,
  docHeight: 16,
  width: 400,
  height: 300,
  attr: 'cola',
  bubbleRadius: 10
};

class Wrapper extends Component {
  // static propTypes = {
  //   children: PropTypes.node,
  //   className: PropTypes.string
  // };
  //
  constructor(props) {
    super(props);
    // const { width, height } = props;
    this.state = {
      transform: null,
      tooltip: null
    };
  }

  componentWillReceiveProps() {
    this.setState({ transform: null });
  }
  // componentDidMount() {
  //   const el = ReactDOM.findDOMNode(this);
  //   const width = el.offsetWidth;
  //   const height = 500; // el.offsetHeight;
  //   console.log('height: ', height);
  //
  //   this.setState({ width, height });
  // }

  componentDidUpdate() {
    // this.props.zoomHandler();
  }
  render() {
    // const { width, height } = this.props;
    const { transform, tooltip } = this.state;
    const { width, height } = this.props;
    // const { x, y, k } = transform;

    // const zoom = function(W, H, center, w, h, margin) {
    //   let k, kh, kw, x, y;
    //   kw = (W - margin) / w;
    //   kh = (H - margin) / h;
    //   k = d3.min([kw, kh]);
    //   x = W / 2 - center.x * k;
    //   y = H / 2 - center.y * k;
    // };
    //
    const { bubbleRadius, zoomHandler } = this.props;
    const pad = 4;
    // console.log('tooltip', tooltip && tooltip.doc.tags);
    return (
      <div>
        {tooltip && (
          <div
            style={{
              position: 'absolute',
              left: `${tooltip.left}px`,
              top: `${tooltip.top}px`
              // zIndex: 1000
            }}
          >
            <div
              style={{
                border: '1px solid black',
                position: 'absolute',
                width: `${bubbleRadius + pad}px`,
                height: `${bubbleRadius + pad}px`,
                borderRadius: '50%',
                left: `${-(bubbleRadius + pad) / 2}px`,
                top: `${-(bubbleRadius + pad) / 2}px`
              }}
            />
            <span className={cx.tooltip}> {tooltip.doc.tags.join(',')}</span>
          </div>
        )}
        <div
          style={{
            transform,
            transformOrigin: 'left top',
            transition: '0.5s ease-in-out'
          }}
        >
          <TagMap
            {...this.props}
            width={width}
            height={height}
            hoverHandler={docOpts => this.setState({ tooltip: docOpts })}
            zoomHandler={({ top, left, docHeight, docWidth }) => {
              // const k = 8;
              const scale = 3;
              // 0.9 / Math.max(docWidth / width, docHeight / height);
              const translate = `translate(${width / 2 -
                left * scale}px,${height / 2 - top * scale}px)scale(${scale})`;
              this.setState({ transform: translate });
              // zoomHandler();
            }}
          />
        </div>
      </div>
    );
  }
}

export default Wrapper;

// WEBPACK FOOTER //
// ./src/components/TagMap/TagMap.jsx
