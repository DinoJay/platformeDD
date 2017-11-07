import React, { Component } from 'react';
import * as d3 from 'd3';
import PropTypes from 'prop-types';
import * as chroma from 'chroma-js';

import { AxisBottom } from '@vx/axis';
import { AreaClosed } from '@vx/shape';
import { LinearGradient } from '@vx/gradient';

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
    const {
      data,
      width,
      height,
      color,
      colorScheme,
      filterTime,
      weekData,
      axisPad
    } = this.props;

    const timeScale = d3
      .scaleTime()
      .domain([d3.min(data, d => d.minDate), d3.max(data, d => d.maxDate)])
      .range([0, width]);

    const ext = d3.extent(weekData, d => d.values.length);
    // TODO
    ext[1] += 10;

    const yScale = d3
      .scaleLinear()
      .domain(ext)
      .range([height, 0]);

    return (
      <div>
        <div>
          {data.map(s => (
            <div
              key={s.key}
              style={{
                left: `${timeScale(s.minDate)}px`,
                width: `${timeScale(s.maxDate) - timeScale(s.minDate)}px`,
                height: `${height + 5}px`
              }}
              className={cx.timeSegment}
              onClick={() =>
                filterTime({ minDate: s.minDate, maxDate: s.maxDate })}
            />
          ))}
        </div>
        <svg>
          <AxisBottom
            scale={timeScale}
            top={height + axisPad}
            left={0}
            stroke={'#1b1a1e'}
            tickTextFill={'#1b1a1e'}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              {colorScheme.map((d, i) => (
                <stop
                  offset={`${i / colorScheme.length * 100}% `}
                  style={{
                    stopColor: chroma(d)
                      .alpha(0.7)
                      .css(),
                    stopOpacity: 1
                  }}
                />
              ))}
            </linearGradient>
          </defs>
          <AreaClosed
            data={weekData}
            xScale={timeScale}
            yScale={yScale}
            x={d => d.maxDate}
            y={d => d.values.length}
            fill="url('#gradient')"
          />
          <g>
            {weekData.map(s => (
              <g>
                <circle
                  r={5}
                  fill={color(s.values.length)}
                  cx={timeScale(s.maxDate)}
                  onClick={() => console.log('click', s)}
                  cy={yScale(s.values.length)}
                />
              </g>
            ))}
          </g>
        </svg>
      </div>
    );
  }
}

Timeline.defaultProps = { axisPad: 10 };

export default Timeline;
