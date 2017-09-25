import React from 'react';
import * as d3 from 'd3';
// import tsnejs from 'tsne';
import _ from 'lodash';

import ReactDom from 'react-dom';
import sketchy from '../utils/d3.sketchy';

import styles from './TagCloud.scss';

import {
  primBrown,
  secBrown,
  thirdBrown
} from '!!sass-variable-loader!../../styles/variables.scss';

// import stampStyle from '../styles/stamp.scss';
// import postcardStyle from '../styles/postcard.scss';
// import sets from './tagGraph';
// import rawBookmarks from './diigo.json';

// import iconStyle from './styles/fileicon.css';

// import iconBackground from './icon-file.png';

// function getRandomInt(min, max) {
//   return Math.floor(Math.random() * (max - (min + 1))) + min;
// }
const ratio = 4;

function autoSizeText(container, attempts = 200) {
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
      elNewFontSize = `${parseInt(el.style.fontSize.slice(0, -2)) - 1}px`;
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

  componentDidMount() {
    // this.componentDidUpdate.bind(this)();
    const { width, height, color } = this.props;
    const node = ReactDom.findDOMNode(this);
    // console.log('node', node);
    autoSizeText(node, 200);
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
        height,
        density: 0,
        sketch: 1
      })
      .selectAll('path')
      .attr('stroke', secBrown);
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
      onClick
    } = this.props;

    const pad = 0;
    const st = {
      left: `${Math.round(left)}px`,
      top: `${Math.round(top)}px`,
      width: `${width}px`,
      height: `${height}px`
      // border: 'black groove',
      // borderRadius: '10%',
    };
    return (
      <div className={styles.tag} style={st} onClick={() => onClick(children)}>
        <span
          style={{
            lineHeight: `${height - pad}px`
          }}
        >
          {children}
        </span>
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

  const size = d3
    .scaleLinear()
    .domain(d3.extent(data, d => d.count))
    .range([20, 50]);

  const first = { name: 'root', children: data };
  const root = d3.hierarchy(first).sum(d => size(d.count));
  treemap(root);
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

  componentWillReceiveProps(nextProps) {
    const data = nextProps.data.sort((a, b) => b.count - a.count);
    const { width, height, padX, padY } = nextProps;
    if (nextProps.data.length !== this.props.data.length) {
      this.setState({
        data,
        root: makeTreemap({ data, width: width / ratio, height, padX, padY })
      });
    }
  }

  componentDidUpdate() {
    this.props.getCoords(this.state.root.children);
  }

  render() {
    const { width, height, color, clickHandler } = this.props;
    console.log('render', this.props, this.state);
    const { data, root } = this.state;
    // const fontSize = d3
    //   .scaleLinear()
    //   .domain(d3.extent(data, d => d.values.length))
    //   .range([15, 50]);

    // console.log('nodes', nodes);
    // const style = {
    //   // position: 'absolute',
    //   // background: 'blue'
    //   // borderRadius: '50%',
    //   // backgroundImage: `url("${iconBackground}")`
    //   borderRadius: '2px',
    //   display: 'inline',
    //   border: 'black solid',
    //   // margin: '20px',
    //   // marginRight: '5px',
    //   // marginTop: '20px',
    //   // marginBottom: '20px',
    //   fontFamily: 'Slackey'
    //   // fontWeight: 'bold'
    // };
    // const Words = data.map(d =>
    //   (<div
    //     style={{
    //       fontSize: fontSize(d.values.length),
    //       background: color(d.key),
    //       ...style
    //     }}
    //     onClick={() => console.log(d)}
    //   >
    //     {`${d.key} `}
    //   </div>)
    // );

    const treemap = root.children.map(d => (
      <Tag {...d} color={color(d.data.key)} onClick={clickHandler}>
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
