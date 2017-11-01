import React, { Component } from 'react';
import * as d3 from 'd3';
import tsnejs from 'tsne';
import _ from 'lodash';
import cola from 'webcola';
import ReactDOM from 'react-dom';

// import TSNE from 'tsne-js';
// import { bboxCollide } from '../utils/helper';
import tpStyle from './tooltip.scss';

import { bboxCollide } from 'd3-bboxCollide';
import { forceSurface } from 'd3-force-surface';

import { Motion, spring } from 'react-motion';

const jaccard = (a, b) =>
  a.length !== 0 && b.length !== 0
    ? 1 - _.intersection(a, b).length / _.union(a, b).length
    : 1;

function runTsne(nodes, links, dists, bbox, docHeight) {
  const width = bbox[1].to.x - bbox[0].from.x;
  const height = bbox[1].to.y - bbox[0].from.y;
  const centerx = d3.scaleLinear().range([bbox[0].from.x, bbox[1].to.x]);
  const centery = d3.scaleLinear().range([bbox[0].from.y, bbox[1].to.y]);

  const model = new tsnejs.tSNE({
    dim: 2,
    perplexity: 50,
    epsilon: 20
  });

  // initialize data with pairwise distances
  model.initDataDist(dists);
  const forcetsne = d3
    .forceSimulation(nodes)
    // .alphaDecay(0.01)
    // .alpha(0.3)
    .force('tsne', alpha => {
      // every time you call this, solution gets better
      model.step();

      // Y is an array of 2-D points that you can plot
      const pos = model.getSolution();

      centerx.domain(d3.extent(pos.map(d => d[0])));
      centery.domain(d3.extent(pos.map(d => d[1])));

      const strength = 1;
      forcetsne.nodes().forEach((d, i) => {
        d.x += alpha * strength * (centerx(pos[i][0]) - d.x);
        d.y += alpha * strength * (centery(pos[i][1]) - d.y);
      });
    })
    .force(
      'container',
      forceSurface()
        .elasticity(0)
        .surfaces(bbox)
        .oneWay(true)
        .radius(docHeight)
    )
    .stop();

  for (let i = 0; i < 300; ++i) forcetsne.tick();

  return nodes.map(d => {
    // TODO: rename
    d.tsne = {
      x: d.x, // centerx(pos[i][0]),
      y: d.y // centery(pos[i][1]) // d.y
    };
    d.x = width / 2;
    d.y = height / 2;
    // TODO: init positions

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

  // console.log(
  //   'mappedCl',
  //   d3
  //     .nest()
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
    this.state = {
      dists: [],
      bbox: [],
      nodes: []
    };

    this.state = this.compNewState(props);
  }

  compNewState(props) {
    const {
      data,
      links,
      width,
      height,
      docWidth,
      docHeight,
      sets,
      // themeGraph,
      attr
    } = props;

    // TODO: fix later
    if (data.length === 0) {
      return {
        dists: [],
        bbox: [],
        nodes: []
      };
    }

    const padDocX = 10;
    const padDocY = 10;
    const nodes = data.map(d => {
      d.width = docWidth + padDocX;
      d.height = docHeight + padDocY;
      d.x = width / 2;
      d.y = height / 2;
      d.setIndex = sets.findIndex(
        e => e.values.findIndex(v => v.url === d.url) !== -1
      );
      return d;
    });

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

    const dists = data.map(a => data.map(b => jaccard(a.tags, b.tags)));

    // const newNodes = runColaForce(nodes, links, width, height);
    const nextNodes = runTsne(nodes, links, dists, bbox, docHeight);

    // const nextNextNodes = runCluster(
    //   nextNodes,
    //   links,
    //   themeGraph,
    //   width,
    //   height
    // );

    const pad = 10;
    const sim = d3
      .forceSimulation(nextNodes)
      .force(
        'link',
        d3
          .forceLink(links)
          .distance(200)
          .strength(1)
      )
      .force(
        'collide',
        d3
          .forceCollide()
          .radius(docHeight / 2 + pad)
          .strength(1)
      )
      // .force('charge', d3.forceManyBody())
      // .force('center', d3.forceCenter(width / 2, height / 2))
      .force('X', d3.forceX(d => d[attr].x).strength(0.5))
      .force('Y', d3.forceY(d => d[attr].y).strength(0.5))
      .force(
        'container',
        forceSurface()
          .elasticity(0)
          .surfaces(bbox)
          .oneWay(true)
          .radius(docHeight)
      )
      .stop();
    // .strength(0.01)
    // .on('end', () => {
    //   this.setState({ nodes: sim.nodes() });
    // });

    for (let i = 0; i < 320; ++i) sim.tick();
    return {
      dists,
      bbox,
      nodes: sim.nodes()
    };
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.height !== this.props.height ||
      nextProps.data.length !== this.props.data.length
    )
      this.setState(this.compNewState(nextProps));
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
      zoomHandler
    } = this.props;

    const style = {
      position: 'absolute',
      // background: 'blue'
      width: `${docWidth}px`,
      height: `${docHeight}px`
      // borderRadius: '50%',
      // backgroundImage: `url("${iconBackground}")`
    };

    const docRender = d => ({ left, top }) => (
      <div key={d.id} style={{ ...style, left: `${left}px`, top: `${top}px` }}>
        <div className={tpStyle.tooltip}>
          <div
            style={{
              width: `${docHeight}px`,
              height: `${docWidth}px`,
              overflow: 'hidden',
              fontSize: '2px',
              border: '1px solid black'
            }}
            onClick={() => zoomHandler({ top, left, docWidth, docHeight })}
          >
            {d.title}
            <span className={tpStyle.tooltiptext}>{d.tags.join(',')}</span>
          </div>
        </div>
      </div>
    );

    // const pathRender = ({ sx, sy, tx, ty }) => (
    //   <path
    //     style={{ stroke: 'grey', strokeWidth: '2px' }}
    //     markerEnd="url(#arrow)"
    //     d={d3.line()([[sx + docWidth, sy + docHeight], [tx + docWidth, ty]])}
    //   />
    // );

    // const linkPaths = links.map(l => (
    //   <Motion
    //     defaultStyle={{
    //       sx: width / 2,
    //       sy: height / 2,
    //       tx: width / 2,
    //       ty: height / 2
    //     }}
    //     style={{
    //       sx: spring(l.source.x),
    //       sy: spring(l.source.y),
    //       tx: spring(l.target.x),
    //       ty: spring(l.target.y)
    //     }}
    //   >
    //     {pathRender}
    //   </Motion>
    // ));

    const Docs = nodes.map(d => (
      <Motion
        defaultStyle={{ left: width / 2, top: height / 2 }}
        style={{
          left: spring(d.x),
          top: spring(d.y)
        }}
      >
        {docRender(d)}
      </Motion>
    ));

    const bubbleRender = s => ({ left, top }) => (
      <circle
        fill={color(s.key)}
        // opacity={0.9}
        r={docWidth}
        cx={left}
        cy={top}
      />
    );
    const Bubbles = sets.map(s => (
      <g key={s.id} style={{ filter: `url( "#gooeyCodeFilter-${s.key}")` }}>
        {s.values.map(d => {
          const n = nodes.find(e => e.title === d.title) || { x: 0, y: 0 };
          return (
            <Motion
              defaultStyle={{ left: width / 2, top: height / 2 }}
              style={{
                left: spring(n.x + docWidth / 2),
                top: spring(n.y + docHeight / 2)
              }}
            >
              {bubbleRender(s)}
            </Motion>
          );
        })}
      </g>
    ));

    const svgStyle = {
      pointerEvents: 'none',
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
                  stdDeviation="10"
                  colorInterpolationFilters="sRGB"
                  result="blur"
                />
                <feColorMatrix
                  in="blur"
                  mode="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
                  result="gooey"
                />
              </filter>
            ))}
            <defs>
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
  attr: 'cola'
};

class Wrapper extends Component {
  // static propTypes = {
  //   children: PropTypes.node,
  //   className: PropTypes.string
  // };
  //
  constructor(props) {
    super(props);
    const { width, height } = props;
    const k = -10;
    this.state = {
      transform: `translate(${width / 2 - width / 2 * k}, ${height / 2 -
        height / 2 * k})`
    };
  }

  // componentDidMount() {
  //   const el = ReactDOM.findDOMNode(this);
  //   const width = el.offsetWidth;
  //   const height = 500; // el.offsetHeight;
  //   console.log('height: ', height);
  //
  //   this.setState({ width, height });
  // }

  render() {
    // const { width, height } = this.props;
    const { transform } = this.state;
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
    return (
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
          zoomHandler={({ top, left, docHeight, docWidth }) => {
            const k = 8;
            const translate = `translate(${width / 2 -
              (left + docWidth / 2) * k}px,${height / 2 -
              (top + docHeight / 2) * k}px)scale(${k})`;
            this.setState({ transform: translate });
          }}
        />
      </div>
    );
  }
}

export default Wrapper;

// WEBPACK FOOTER //
// ./src/components/TagMap/TagMap.jsx
