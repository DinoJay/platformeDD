import React from 'react';
import * as d3 from 'd3';
import _ from 'lodash';

// import stampStyle from '../styles/stamp.scss';

import TagMap from './TagMap';
import TagCloud from './TagCloud';

// import iconBackground from './icon-file.png';

// function getRandomInt(min, max) {
//   return Math.floor(Math.random() * (max - (min + 1))) + min;
// }

// function MouseWheelHandler(e)
// {
// 	//yes, I know this zoom method is pretty awesome and I've figured it out myself.
// 	//I'd appreciate it if you gave me some proper credit if you intend to steal this.
//
// 	var delta = (e.deltaY>0) ? -6 : 6;
// 	var elm = document.getElementById("subjects");//document.body;
// 	var newZoom = zoom *  (1 + (delta * 0.05));
// 	if ( newZoom < 0.067 ) newZoom = 0.067;
// 	else if ( newZoom > 4 ) newZoom = 4;
// 	delta = newZoom  / zoom  - 1;
// 	if ( newZoom != zoom)
// 	{
// 		zoom = newZoom;
// 		tx -= ((e.clientX || window.event.clientX)+ (window.scrollX || document.documentElement.scrollLeft) - tx) * delta;
// 		ty -= ((e.clientY || window.event.clientY)+ (window.scrollY || document.documentElement.scrollTop) - ty) * delta;
// 		if ( zoom < 0.12 )
// 		{
// 			var f = (zoom-0.067) / (0.12 - 0.067);
// 			tx = (window.innerWidth * 0.5  + (window.scrollX || document.documentElement.scrollLeft) - 350) * (1-f) + tx * f;
// 			ty = (window.innerHeight * 0.5 +  (window.scrollY || document.documentElement.scrollTop) - 320)  * (1-f) + ty * f;
// 		}
// 		var transfromString = ("matrix("+zoom+",0,0,"+zoom+","+tx+","+ty+")");
// 		elm.style.webkitTransform = transfromString;
// 		elm.style.MozTransform = transfromString;
// 		elm.style.msTransform = transfromString;
// 		elm.style.OTransform = transfromString;
// 		elm.style.transform = transfromString;
// 	}
// 	document.getElementById("zoomslider").value = zoom *1000;
// 	e.preventDefault();
// 	return false;
//
// }

function setify(data) {
  return d3
    .nest()
    .key(d => d.key)
    .entries(
      _.flattenDeep(
        data.map(d =>
          d.tags.map(t => {
            d.key = t;
            return d;
          })
        )
      )
    )
    .map(d => {
      d.count = d.values.length;
      return d;
    })
    .filter(d => d.count > 1);
}

class Layout extends React.Component {
  static propTypes() {
    return {
      w1: React.PropTypes.number.isRequired,
      h1: React.PropTypes.number.isRequired,
      w1: React.PropTypes.number.isRequired,
      h1: React.PropTypes.number.isRequired,
      data: React.PropTypes.number.isRequired
    };
  }

  constructor(props) {
    super(props);

    const { articleGraph, themeGraph } = props;
    // console.log('data', data);

    function spread(data, key, attr = 'attr') {
      return _.flatten(
        data.map(d =>
          d[key].map(p => {
            const clone = _.cloneDeep(d);
            clone[attr] = p;
            return clone;
          })
        )
      );
    }
    const dataSpread = spread(articleGraph.nodes, 'parents', 'key');
    const nested = d3
      .nest()
      .key(d => d.key)
      .entries(dataSpread)
      .map(d => {
        d.theme = d.values[0].themes[0];
        return d;
      });
    //
    const themed = d3
      .nest()
      .key(d => d.key)
      .entries(spread(articleGraph.nodes, 'themes', 'key'));

    console.log('nested', nested, 'spreadData', dataSpread);

    // const root = d3
    //   .stratify()
    //   .id(d => d.name)
    //   .parentId(d => d.parent)(table);

    // console.log('data', data);

    this.state = { sets: nested, themed };

    // sets(bookmarks)
  }

  componentDidMount() {}

  componentWillReceiveProps(nextProps) {
    console.log('nextProps', nextProps);
  }

  render() {
    const { data, sets, links, themed } = this.state;
    const {
      color,
      articleGraph,
      themeGraph,
      w1,
      h1,
      w2,
      h2,
      attr
    } = this.props;

    // console.log('articleGraph', articleGraph.links);

    // const { w1, h1, w2, h2 } = this.props;
    // console.log('width', width, 'height', height);

    // const color = d3.scaleOrdinal(d3.schemeCategory20);
    // const color = d3.scaleSequential(chromatic.interpolatePiYG);

    return (
      <div>
        <div
          style={{
            position: 'relative',
            marginBottom: '10px',
            height: `${h1}px`
          }}
        >
          <TagCloud
            data={sets}
            width={w1}
            height={h1}
            color={color}
            clickHandler={tag => {
              this.setState(oldState => {
                const newData = oldState.data.filter(d => d.tags.includes(tag));
                console.log('oldState', newData);
                return {
                  data: newData,
                  sets: setify(newData)
                };
              });
            }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <TagMap
            data={articleGraph.nodes}
            links={articleGraph.links}
            themeGraph={themeGraph}
            attr={attr}
            docWidth={30}
            docHeight={30}
            sets={themed}
            width={w2}
            height={h2}
            color={color}
          />
        </div>
      </div>
    );
  }
}

Layout.defaultProps = {
  radius: 5,
  docWidth: 12,
  docHeight: 16,
  w1: 1000,
  h1: 200,
  h2: 800,
  w2: 1000
};

export default Layout;

// WEBPACK FOOTER //
// ./src/components/Bookmarks/index.jsx
