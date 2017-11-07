// import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import _ from 'lodash';

import * as chromatic from 'd3-scale-chromatic';

import cx from './Journal.scss';

import bookIcon from './book.svg';
import magnifierIcon from './magnifier.svg';
import mapIcon from './map.svg';

import TagMap from './TagMap';
import TagCloud from './TagCloud';
import Timeline from './Timeline';

const themes = [0, 1, 2, 3, 4, 5];
const colors = ['#d9384a', '#3e6454', '#5a74b0', `#f4b32a`];

// console.log('realData', realData);

class Journal extends React.Component {
  static propTypes() {
    return {
      path: React.PropTypes.string.isRequired
    };
  }

  constructor(props) {
    super(props);
  }

  // componentShouldUpdate() {
  //   return false;
  // }

  componentDidMount() {
    const { screenResize, processData } = this.props;
    // processData();
    const cont = ReactDOM.findDOMNode(this.cont);
    screenResize({
      width: cont.offsetWidth,
      height: cont.offsetHeight
    });

    window.addEventListener('resize', () => {
      screenResize({
        width: ReactDOM.findDOMNode(this.cont).offsetWidth,
        height: ReactDOM.findDOMNode(this.cont).offsetHeight
      });
    });
  }

  // componentWillReceiveProps(props) {
  //   console.log('newProps', props);
  //
  //   this.setState({
  //     path: props.path
  //   });
  // }

  render() {
    const {
      tagCloudWidth,
      tagCloudHeight,
      tagCloudSets,

      tagMapWidth,
      tagMapHeight,
      tagMapData,
      tagMapSets,
      sets,
      timelineData,
      timelineWeekData,
      width,
      height
    } = this.props;

    const timelineHeight = 100;
    const color = d3
      .scaleSequential()
      .interpolator(chromatic.interpolateYlGnBu)
      .domain([1, 15])
      .clamp(true);
    // .range(chromatic.schemeBlues[9]);

    const maxCols = 4;
    const colDiv = 2;
    const colNum = 8;
    // timelineData.length > maxCols ? maxCols : timelineData.length;
    const colWidth = `${Math.round(1 / colNum * (100 - colNum - 6)) / colDiv}%`;
    const rowNum = 2; // Math.ceil(timelineData.length / colNum);
    const rowHeight = `${Math.round(1 / rowNum * 100)}%`;
    console.log(
      'colWidth',
      colWidth,
      'colNum',
      colNum,
      'rowHeight',
      rowHeight,
      'rowNum',
      rowNum
    );
    return (
      <div className="container-fluid">
        <h1>Bookmark Tag Visualization</h1>
        <div ref={cont => (this.cont = cont)} style={{ margin: '20px' }}>
          <div className="row mb-3">
            <fieldset className="col-2">
              <legend>Legend</legend>
              <div className="row no-gutters">
                {themes.map(c => (
                  <div
                    style={{ background: color(c), width: '200%' }}
                    className="col success"
                  >
                    {c}
                  </div>
                ))}
              </div>
            </fieldset>
          </div>
          <div>
            <svg
              style={{
                position: 'absolute',
                left: 0,
                width: `${width}px`,
                height: `${height}px`
              }}
            />
            <div
              className="mb-3"
              style={{
                position: 'relative',
                height: `${tagCloudHeight}px`
              }}
            >
              <TagCloud
                data={tagCloudSets}
                width={tagCloudWidth}
                height={tagCloudHeight}
                color={color}
              />
            </div>
            <div
              style={{
                position: 'relative',
                marginBottom: '40px',
                height: `${timelineHeight}px`
              }}
            >
              <Timeline
                {...this.props}
                data={timelineData}
                weekData={timelineWeekData}
                width={tagCloudWidth}
                height={timelineHeight}
                color={color}
                colorScheme={chromatic.schemeYlGnBu[9]}
              />
            </div>
            <div
              style={{
                position: 'relative',
                height: `${tagMapHeight}px`
              }}
            >
              <div
                className={cx.grid}
                style={{
                  gridTemplateColumns: `repeat(${colNum *
                    colDiv}, ${colWidth})`,
                  gridTemplateRows: `repeat(${rowNum}, ${rowHeight})`
                }}
              >
                {timelineData.map((d, i) => (
                  <GridCell
                    i={i % colNum}
                    j={Math.floor(i / colNum)}
                    colSpan={3}
                    rowSpan={1}
                  >
                    {({ w, h, mode, markerHandler }) => (
                      <div
                        style={{ overflow: 'hidden', marginLeft: `${10}px` }}
                      >
                        <TagMap
                          data={d.values}
                          links={[]}
                          attr={'tsne'}
                          docWidth={mode === 1 ? 25 : 13}
                          docHeight={mode === 1 ? 25 : 13}
                          bubbleRadius={mode === 1 ? 30 : 15}
                          sets={d.sets}
                          width={w - 10}
                          height={h - 10}
                          color={color}
                          zoomHandler={() => {
                            markerHandler();
                          }}
                          hoverHandler={d => console.log(d)}
                        />
                      </div>
                    )}
                  </GridCell>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class GridCell extends React.Component {
  static propTypes() {
    return {
      style: PropTypes.object,
      children: PropTypes.func.isRequired,
      i: PropTypes.number.isRequired,
      j: PropTypes.number.isRequired,
      colSpan: PropTypes.number.isRequired,
      rowSpan: PropTypes.number.isRequired
    };
  }
  constructor(props) {
    super(props);
    this.state = { width: 0, height: 0, mode: 0 };
  }

  componentWillReceiveProps() {
    const el = ReactDOM.findDOMNode(this);
    const height = el.offsetHeight;
    const width = el.offsetWidth;
    // console.log('element', el.getBoundingClientRect());
    this.setState({ width, height });
  }

  // shouldComponentUpdate() {}
  //
  // componentDidUpdate() {
  //   const el = ReactDOM.findDOMNode(this);
  //   const width = el.offsetWidth;
  //   const height = el.offsetHeight;
  //   console.log('element', el.getBoundingClientRect());
  //   // this.setState({ width, height });
  // }

  render() {
    const { width, height, mode } = this.state;
    const { style, children, rowSpan, colSpan } = this.props;

    let Icon;
    switch (mode) {
      case 0: {
        Icon = <img src={mapIcon} alt="map" className={cx.mapIcon} />;
        break;
      }
      case 1: {
        Icon = (
          <img src={magnifierIcon} alt="magnif" className={cx.magnifierIcon} />
        );
        break;
      }
      default: {
        Icon = <img src={bookIcon} alt="book" className={cx.bookIcon} />;
        break;
      }
    }

    return (
      <div
        className={cx.cell}
        style={{
          ...style,
          gridColumnEnd: `span ${mode === 1 ? colSpan * 3 : colSpan}`,
          gridRowEnd: `span ${mode === 1 ? rowSpan * 2 : rowSpan}`
        }}
      >
        <div
          className={cx.control}
          onClick={() => {
            this.setState(state => ({ mode: state.mode === 0 ? 1 : 0 }));
          }}
        >
          <span> {Icon} </span>
        </div>
        {children({
          w: mode === 1 ? width * 3 : width,
          h: mode === 1 ? height * 2 : height,
          mode,
          markerHandler: () => this.setState({ mode: 2 })
        })}
      </div>
    );
  }
}

export default Journal;
