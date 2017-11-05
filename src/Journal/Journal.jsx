// import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import _ from 'lodash';

import * as chromatic from 'd3-scale-chromatic';

import cx from './Journal.scss';

import bookIcon from './book.svg';

import TagMap from './TagMap';
import TagCloud from './TagCloud';
import Timeline from './Timeline';

const themes = [0, 1, 2, 3, 4, 5];

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
    screenResize({
      width: window.innerWidth,
      height: window.innerHeight
    });

    window.addEventListener('resize', () => {
      screenResize({
        width: window.innerWidth,
        height: window.innerHeight
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
      width,
      height
    } = this.props;

    const timelineHeight = 100;
    const color = d3
      .scaleOrdinal()
      .domain(themes)
      .range(chromatic.schemeDark2);

    const maxCols = 4;
    const colDiv = 2;
    const colNum =
      timelineData.length > maxCols ? maxCols : timelineData.length;
    const colWidth = `${Math.round(1 / colNum * 100) / colDiv}%`;
    const rowNum = Math.ceil(timelineData.length / colNum);
    const rowHeight = `${Math.round(1 / rowNum * 100)}%`;
    // console.log(
    //   'colWidth',
    //   colWidth,
    //   'colNum',
    //   colNum,
    //   'rowHeight',
    //   rowHeight,
    //   'rowNum',
    //   rowNum
    // );
    return (
      <div>
        <h1>Platforme DD - Articles </h1>
        <div className="m-3 mb-3">
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
            <fieldset className="col-3">
              <legend>Layout</legend>
              <div className="form-check">
                <label className="form-check-label">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="exampleRadios"
                    id="cola"
                    value="option1"
                    onClick={() =>
                      this.setState(oldState => ({
                        clicked: !oldState.clicked
                      }))}
                  />
                  bottom down links
                </label>
              </div>
              <div className="form-check ">
                <label className="form-check-label">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="exampleRadios"
                    id="exampleRadios2"
                    onClick={() =>
                      this.setState(oldState => ({
                        clicked: !oldState.clicked
                      }))}
                  />
                  themes
                </label>
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
                width={tagCloudWidth}
                height={timelineHeight}
                color={color}
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
                    colSpan={d.values.length > 15 ? 2 : 1}
                    rowSpan={d.values.length > 15 ? 2 : 1}
                    style={{
                      height: '100%'
                    }}
                  >
                    {({ w, h, focus }) => (
                      <div style={{ overflow: 'hidden' }}>
                        <TagMap
                          data={d.values}
                          links={[]}
                          attr={'tsne'}
                          docWidth={focus ? 25 : 10}
                          docHeight={focus ? 25 : 10}
                          bubbleRadius={focus ? 30 : 15}
                          sets={d.sets}
                          width={w - 10}
                          height={h - 10}
                          color={color}
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
    this.state = { width: 0, height: 0, focus: false };
  }

  componentWillReceiveProps() {
    const el = ReactDOM.findDOMNode(this);
    const height = el.offsetHeight;
    const width = el.offsetWidth;
    // console.log('element', el.getBoundingClientRect());
    this.setState({ width, height });
  }
  //
  // componentDidUpdate() {
  //   const el = ReactDOM.findDOMNode(this);
  //   const width = el.offsetWidth;
  //   const height = el.offsetHeight;
  //   console.log('element', el.getBoundingClientRect());
  //   // this.setState({ width, height });
  // }

  render() {
    const { width, height, focus } = this.state;
    const { style, children, rowSpan, colSpan } = this.props;
    return (
      <div
        className={cx.cell}
        style={{
          ...style,
          gridColumnEnd: `span ${focus ? colSpan * 2 : colSpan}`,
          gridRowEnd: `span ${focus ? rowSpan * 2 : rowSpan}`
        }}
      >
        <div
          className={cx.control}
          onClick={() => {
            this.setState(state => ({ focus: !state.focus }));
          }}
        >
          {<span>{focus ? '+' : '-'}</span>}
        </div>
        {children({
          w: focus ? width * 2 : width,
          h: focus ? height * 2 : height,
          focus
        })}
      </div>
    );
  }
}

export default Journal;
