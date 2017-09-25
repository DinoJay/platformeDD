import React from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import * as chromatic from 'd3-scale-chromatic';

// import stampStyle from '../styles/stamp.scss';

import TagMap from './TagMap';
import TagCloud from './TagCloud';

// import iconBackground from './icon-file.png';

// function getRandomInt(min, max) {
//   return Math.floor(Math.random() * (max - (min + 1))) + min;
// }

function genLinks(data) {
  return data.reduce((acc, d) => {
    if (d.sortants[0] === '') return acc;
    console.log('d.sortants', d.sortants, d.titre[0]);
    const outLinks = d.outgoing.map(t => ({
      source: d.title,
      target: t
    }));
    return acc.concat(outLinks);
    // }
  }, []);
}

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

    const { data } = props;
    console.log('data', data);
    const processedData = data.map(d => {
      d.tags = d.themes[0].theme ? d.themes[0].theme.filter(e => e !== '') : [];
      d.outgoing = d.sortants[0].sortant;
      d.title = d.titre[0];
      // d.parent = d.parents[0].parent;
      // if (d.parents.length > 0) console.log('parents', d.parents);
      return d;
    });
    const links = genLinks(processedData);

    console.log('processedData', processedData, 'links', links);

    // const root = d3
    //   .stratify()
    //   .id(d => d.name)
    //   .parentId(d => d.parent)(table);

    console.log('processedData', processedData);

    this.state = { data: processedData, sets: setify(data), links };

    // sets(bookmarks)
  }

  componentDidMount() {}

  componentWillReceiveProps(nextProps) {
    console.log('nextProps', nextProps);
  }

  render() {
    const { data, sets, links } = this.state;
    const { w1, h1, w2, h2 } = this.props;
    // console.log('width', width, 'height', height);

    // const color = d3.scaleOrdinal(d3.schemeCategory20);
    // const color = d3.scaleSequential(chromatic.interpolatePiYG);
    const color = d3.scaleOrdinal(chromatic.schemeSet2);
    return (
      <div className="container">
        <div
          style={{
            position: 'relative',
            marginBottom: '10px',
            height: `${h1}px`
          }}
        >
          <div>
            <form>
              <input type="radio" name="gender" value="tree" /> Tree
              <input type="radio" name="gender" value="graph" /> Graph
              <input type="radio" name="gender" value="cluster" checked />{' '}
              Cluster
            </form>
          </div>
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
            data={data}
            links={links}
            docWidth={30}
            docHeight={30}
            sets={sets}
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
