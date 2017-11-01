// import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import ReactDOM from 'react-dom';
import * as d3 from 'd3';
import _ from 'lodash';

import * as chromatic from 'd3-scale-chromatic';

import cx from './Journal.scss';

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
      .range(chromatic.schemeSet2);

    const maxCols = 4;
    const maxRows = 2;
    const colNum =
      timelineData.length > maxCols ? maxCols : timelineData.length;
    const colWidth = `${Math.round(1 / colNum * 100)}%`;
    const rowNum = timelineData.length > colNum ? 2 : 1;
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
      <div>
        <h1>Platforme DD - Articles </h1>
        <div className="m-3 mb-3">
          <div className="row mb-3">
            <fieldset className="col-2">
              <legend>Legend</legend>
              <table className="table table-sm">
                <tbody>
                  {themes.map(c => (
                    <tr className="success">
                      <td style={{ background: color(c) }}>{c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  />{' '}
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
                  />{' '}
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
              style={{
                position: 'relative',
                marginBottom: '10px',
                height: `${tagCloudHeight}px`
              }}
            >
              <TagCloud
                data={sets}
                width={tagCloudWidth}
                height={tagCloudHeight}
                color={color}
              />
            </div>
            <div
              style={{
                position: 'relative',
                marginBottom: '10px',
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
                  gridTemplateColumns: `repeat(${colNum}, ${colWidth})`,
                  gridTemplateRows: `repeat(${rowNum}, ${rowHeight})`
                }}
              >
                {timelineData.map(d => (
                  <CellWrapper className={cx.cell}>
                    {dim => (
                      <TagMap
                        data={d.values}
                        links={[]}
                        attr={'tsne'}
                        docWidth={30}
                        docHeight={30}
                        sets={d.sets}
                        width={dim.width}
                        height={dim.height}
                        color={color}
                      />
                    )}
                  </CellWrapper>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class CellWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = { width: 0, height: 0 };
  }

  // componentDidMount() {
  //   const el = ReactDOM.findDOMNode(this);
  //   const width = el.offsetWidth;
  //   const height = el.offsetHeight;
  //   // console.log('element', el.getBoundingClientRect());
  //   this.setState({ width, height });
  // }
  //
  // componentDidUpdate() {
  //   const el = ReactDOM.findDOMNode(this);
  //   const width = el.offsetWidth;
  //   const height = el.offsetHeight;
  //   console.log('element', el.getBoundingClientRect());
  //   // this.setState({ width, height });
  // }

  render() {
    // const { width, height } = this.state;

    // TODO: fix later
    const el = ReactDOM.findDOMNode(this);
    const width = el !== null ? el.offsetWidth : 0;
    const height = el !== null ? el.offsetHeight : 0;

    // console.log('width ', width, 'height ', height);

    const { className, children } = this.props;
    return (
      <div className={className} style={{ height: '100%' }}>
        {children({ width, height })}
      </div>
    );
  }
}

export default Journal;
