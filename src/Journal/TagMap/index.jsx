import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import tsnejs from 'tsne';

import TSNE from 'tsne-js';
import _ from 'lodash';
import cola from 'webcola';
import ReactDOM from 'react-dom';

import * as chroma from 'chroma-js';
// import TSNE from 'tsne-js';
// import { bboxCollide } from '../utils/helper';

import polyBbox from './boundingBox';
import { bboxCollide } from 'd3-bboxCollide';
import { forceSurface } from 'd3-force-surface';

import { Motion, spring } from 'react-motion';

import cx from './index.scss';

import offsetInterpolate from './polyOffset';

const boundingBox = (width, height, padX = 0, padY = 0) => [
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

const polyDim = points => {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  // for(int i = 0; i < points.length; i += 2) {
  points.forEach((d, i) => {
    const x = points[i][0];
    const y = points[i][1];
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });
  const width = maxX - minX;
  const height = maxY - minY;
  return { width, height };
};

const jaccard = (a, b) =>
  a.length !== 0 && b.length !== 0
    ? 1 - _.intersection(a, b).length / _.union(a, b).length
    : 1;

const runTsne = (inputData, iter = 400) => {
  const dists = inputData.map(a => inputData.map(b => jaccard(a.tags, b.tags)));

  const model = new tsnejs.tSNE({
    dim: 2,
    perplexity: 50,
    epsilon: 20
  });

  // initialize data with pairwise distances
  model.initDataDist(dists);

  for (let i = 0; i < iter; ++i) model.step();

  // Y is an array of 2-D points that you can plot
  return model.getSolution();
};

const pathStr = points => d3.line().curve(d3.curveBasisClosed)(points);

const groupPath = function(nodes, offset = 1) {
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

  return d3.polygonHull(fakePoints).reverse();
};

const computeNodes = ({ data, sets, docWidth, docHeight, padDocX, padDocY }) =>
  data.map(d => {
    d.width = docWidth + padDocX;
    d.height = docHeight + padDocY;
    d.x = 0; // width / 2;
    d.y = 0; // height / 2;
    d.setIndex = sets.findIndex(
      e => e.values.findIndex(v => v.url === d.url) !== -1
    );
    return d;
  });

// const bbox = boundingBox(width, height);

class Hull extends Component {
  static propTypes = {
    points: PropTypes.array.isRequired,
    className: PropTypes.string,
    offset: PropTypes.number.isRequired,
    zoomHandler: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = { selected: false };
  }

  render() {
    const { points, offset, className, zoomHandler } = this.props;
    const { selected } = this.state;
    const hull = groupPath(points, offset);
    return (
      <path
        className={className}
        fill={chroma('white')
          .alpha(0)
          .css()}
        stroke="black"
        strokeWidth={selected ? '1px' : 0}
        d={pathStr(hull)}
        // onMouseOver={() => console.log('yeah')}
        onClick={() => {
          const center = d3.polygonCentroid(hull);
          const dim = polyDim(hull);
          this.setState(state => ({ selected: !state.selected }));
          zoomHandler({
            left: center[0] + dim.width * 1 / 4,
            top: center[1],
            w: dim.width + dim.width * 1 / 3, // 1d3.polygonLength(hull),
            h: dim.height // d3.polygonLength(hull)
          });
        }}
      />
    );
  }
}

const tagMapPropTypes = {
  docWidth: React.PropTypes.array.isRequired,
  docHeight: React.PropTypes.array.isRequired,
  width: React.PropTypes.number.isRequired,
  height: React.PropTypes.number.isRequired
};

class TagMap extends Component {
  static propTypes = tagMapPropTypes;

  constructor(props) {
    super(props);

    const inputData = computeNodes(props);

    const output = runTsne(inputData, 400);

    const nodes = inputData.map((d, i) => {
      d.tsne = {
        pos: output[i]
      };
      return d;
    });
    this.state = { nodes };
  }

  componentWillReceiveProps(nextProps) {
    const { height, width, docWidth, docHeight } = nextProps;
    const oldNodes = this.state.nodes;
    const oldHeight = this.props.height;
    const oldWidth = this.props.width;

    const bbox = boundingBox(width, height, docWidth / 2, docHeight / 2);

    let positions;
    let inputData;
    if (this.props.data.length !== nextProps.data.length) {
      inputData = computeNodes(nextProps);
      positions = runTsne(inputData, 400);
    } else {
      positions = oldNodes.map(d => d.tsne.pos);
      inputData = oldNodes;
    }

    // TODO: make real check
    // const oldWidth = this.props.width;

    if (height !== oldHeight || width !== oldWidth) {
      const centerX = d3
        .scaleLinear()
        .range([bbox[0].from.x, bbox[1].to.x])
        .domain(d3.extent(positions.map(d => d[0])));

      const centerY = d3
        .scaleLinear()
        .range([bbox[0].from.y, bbox[1].to.y])
        .domain(d3.extent(positions.map(d => d[1])));

      const nodes = inputData.map((d, i) => {
        d.tsne = {
          pos: positions[i]
        };
        d.tx = centerX(positions[i][0]);
        d.ty = centerY(positions[i][1]);
        return d;
      });

      const pad = 5;
      const sim = d3
        .forceSimulation(nodes)
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

      this.setState({ nodes });
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
              onClick={() =>
                zoomHandler({ top, left, w: docWidth, h: docHeight })}
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
              <Hull
                className={cx.hull}
                points={s.values}
                offset={docHeight}
                zoomHandler={zoomHandler}
              />
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
  padDocX: 5,
  padDocY: 5,
  width: 400,
  height: 300,
  // attr: 'cola',
  bubbleRadius: 10
};

class Wrapper extends Component {
  static propTypes = tagMapPropTypes;
  //
  constructor(props) {
    super(props);
    // const { width, height } = props;
    this.zoom = this.zoom.bind(this);
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

  // componentDidUpdate() {
  //   // this.props.zoomHandler();
  // }
  zoom({ doc, top, left, w, h }) {
    const { width, height } = this.props;
    // const k = 8;
    const scale = 0.9 / Math.max(w / width, h / height);
    const translate = `translate(${width / 2 - left * scale}px,${height / 2 -
      top * scale}px)scale(${scale})`;
    this.setState({ transform: translate });
    // zoomHandler();
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
            zoomHandler={this.zoom}
          />
          {}
        </div>
      </div>
    );
  }
}

export default Wrapper;

// WEBPACK FOOTER //
// ./src/components/TagMap/TagMap.jsx
