import React from 'react';
import * as d3 from 'd3';
// import tsnejs from 'tsne';
import _ from 'lodash';

import ReactDom from 'react-dom';
import sketchy from '../utils/d3.sketchy';

import cx from './index.scss';

// import stampStyle from '../cx/stamp.scss';
// import postcardStyle from '../cx/postcard.scss';
// import sets from './tagGraph';
// import rawBookmarks from './diigo.json';

// import iconStyle from './cx/fileicon.css';

// import iconBackground from './icon-file.png';

// function getRandomInt(min, max) {
//   return Math.floor(Math.random() * (max - (min + 1))) + min;
// }
const ratio = 4;

function autoSizeText(container, pad = 1, attempts = 200) {
  const setChildrenToInheritFontSize = el => {
    el.style.fontSize = 'inherit';
    _.each(el.children, child => {
      setChildrenToInheritFontSize(child);
    });
  };

  const resizeText = el => {
    attempts--;
    let elNewFontSize;
    if (
      el.style.fontSize === '' ||
      el.style.fontSize === 'inherit' ||
      el.style.fontSize === 'NaN'
    ) {
      elNewFontSize = '140px'; // largest font to start with
    } else {
      elNewFontSize = `${parseInt(el.style.fontSize.slice(0, -2)) - pad}px`;
    }
    el.style.fontSize = elNewFontSize;

    // this function can crash the app, so we need to limit it
    if (attempts <= 0) {
      return;
    }

    if (el.scrollWidth > el.offsetWidth || el.scrollHeight > el.offsetHeight) {
      resizeText(el);
    }
  };
  setChildrenToInheritFontSize(container);
  resizeText(container);
}

class Tag extends React.Component {
  static propTypes() {
    return {
      children: React.PropTypes.array.isRequired,
      width: React.PropTypes.array.isRequired,
      height: React.PropTypes.number.isRequired,
      left: React.PropTypes.number.isRequired,
      top: React.PropTypes.number.isRequired
    };
  }
  constructor(props) {
    super(props);
    this.update = this.update.bind(this);
  }

  componentDidMount() {
    // this.update();
  }

  componentDidUpdate() {
    this.update();
  }

  update() {
    // this.componentDidUpdate.bind(this)();
    const { width, height, color, pad } = this.props;
    const node = ReactDom.findDOMNode(this);
    // console.log('node', node);
    autoSizeText(node, pad);
    d3
      .select(this.svg)
      .selectAll('*')
      .remove();

    const paths = sketchy
      .rectStroke({
        svg: d3.select(this.svg),
        x: 0,
        y: 0,
        width,
        height: height - pad,
        density: 0,
        sketch: 1
      })
      .selectAll('path')
      .attr('stroke', color)
      .attr('stroke-width', '2');
  }

  render() {
    const {
      left,
      top,
      width,
      height,
      children,
      color,
      fill,
      pad,
      onClick
    } = this.props;

    // const p = <rect stroke={color} width={width} height={height} />;
    const st = {
      left: `${Math.round(left)}px`,
      top: `${Math.round(top)}px`,
      width: `${width}px`,
      height: `${height - pad}px`
      // border: 'black groove',
      // borderRadius: '10%',
    };
    return (
      <div className={cx.tag} style={st} onClick={() => onClick(children)}>
        <span style={{ lineHeight: `${height - pad}px` }}>{children}</span>
        <svg
          ref={svg => (this.svg = svg)}
          style={{
            width: `${width}px`,
            height: `${height}px`
          }}
        />
      </div>
    );
  }
}

Tag.defaultProps = {
  left: 0,
  top: 0,
  pad: 10,
  width: 0,
  height: 0,
  children: 0,
  color: 'blue',
  fill: 'white',
  clickHandler: () => null
};

function makeTreemap({ data, width, height, padX, padY }) {
  const treemap = d3
    .treemap()
    .size([width, height])
    .paddingInner(3)
    .round(true)
    .tile(d3.treemapSquarify.ratio(1));

  // data.forEach(d => (d.count = d.values.length));

  const size = d3
    .scaleLinear()
    .domain(d3.extent(data, d => d.count))
    .range([20, 50]);

  const first = { name: 'root', children: data };
  // console.log('root data', data);
  const root = d3.hierarchy(first).sum(d => size(d.count));
  treemap(root);
  root.children = root.children || [];
  root.children.forEach(d => {
    // d.x0 += padX / 2;
    // d.x1 -= padX / 2;
    // d.y0 += padY / 2;
    // d.y1 -= padY / 2;
    d.left = padX / 2 + Math.round(d.x0 * ratio);
    d.top = padY / 2 + Math.round(d.y0);
    d.width = Math.round(d.x1 * ratio) - Math.round(d.x0 * ratio) - padX / 2;
    d.height = Math.round(d.y1) - Math.round(d.y0) - padY / 2;
  });

  return root;
  // const padY = 10;
  // const padX = 20;
}

class TagCloud extends React.Component {
  static propTypes() {
    return {
      docWidth: React.PropTypes.array.isRequired,
      docHeight: React.PropTypes.array.isRequired,
      width: React.PropTypes.number.isRequired,
      height: React.PropTypes.number.isRequired,
      padX: React.PropTypes.number.isRequired,
      padY: React.PropTypes.number.isRequired
    };
  }

  constructor(props) {
    super(props);
    const { width, height, padX, padY } = props;
    const data = props.data.sort((a, b) => b.count - a.count);
    this.state = {
      data,
      root: makeTreemap({ data, width: width / ratio, height, padX, padY })
    };
  }

  // shouldComponentUpdate() {
  //   return false;
  // }

  componentWillReceiveProps(nextProps) {
    const data = nextProps.data.sort((a, b) => b.count - a.count);
    const { width, height, padX, padY } = nextProps;
    // if (nextProps.data.length !== this.props.data.length) {
    this.setState({
      data,
      root: makeTreemap({ data, width: width / ratio, height, padX, padY })
    });
    // }
  }

  // componentDidUpdate() {
  //   this.props.getCoords(this.state.root.children);
  // }

  render() {
    const { width, height, color, clickHandler } = this.props;
    console.log('render', this.props, this.state);
    const { data, root } = this.state;

    const treemap = root.children.map(d => (
      <Tag {...d} color={color(d.data.theme)} onClick={clickHandler}>
        {d.data.key}
      </Tag>
    ));

    // console.log('treemap')

    const svgStyle = {
      pointerEvents: 'none',
      width: `${width}px`,
      height: `${height}px`,
      position: 'absolute',
      left: 0,
      top: 0
    };
    return (
      <div>
        <div style={{ textAlign: 'center' }}>{treemap}</div>
        <svg style={svgStyle} />
      </div>
    );
  }
}

TagCloud.defaultProps = {
  width: 800,
  height: 400,
  padX: 0,
  padY: 0,
  clickHandler: () => null,
  color: () => 'red',
  getCoords: d => d
};

export default TagCloud;
