import React, { Component } from 'react';
import * as d3 from 'd3';
import PropTypes from 'prop-types';
import cx from './index.scss';

class Timeline extends Component {
  static propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    data: PropTypes.array
  };

  constructor(props) {
    super(props);

    // const { data, width } = props;

    // this.state = { timeScale };
  }

  render() {
    const { data, width, height, color, filterTime } = this.props;
    const timeScale = d3
      .scaleTime()
      .domain([d3.min(data, d => d.minDate), d3.max(data, d => d.maxDate)])
      .range([0, width]);

    return (
      <div>
        {data.map(s => (
          <div
            key={s.key}
            style={{
              left: `${timeScale(s.minDate)}px`,
              width: `${timeScale(s.maxDate) - timeScale(s.minDate)}px`,
              height: `${height}px`
            }}
            className={cx.timeSegment}
            onClick={() =>
              filterTime({ minDate: s.minDate, maxDate: s.maxDate })}
          >
            {s.values.map((d, j) => {
              const innerScale = d3
                .scaleBand()
                .domain(d3.range(0, s.values.length + 1))
                .range([0, timeScale(s.maxDate) - timeScale(s.minDate)]);
              return (
                <div
                  key={d.id}
                  style={{
                    left: `${innerScale(j)}px`,
                    width: `${0}px`,
                    height: `${height}px`,
                    background: 'black'
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    );
  }
}

export default Timeline;
