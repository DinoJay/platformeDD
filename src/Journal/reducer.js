// import { combineReducers } from 'redux';
// import cards from './cards';
// import visibilityFilter from './visibilityFilter';
import * as d3 from 'd3';
import _ from 'lodash';
import { SCREEN_RESIZE, PROCESS_DATA, FILTER_TIME } from './actions';

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
      // d.tags = i % 2 ? ['hallo'] : ['test'];
      return d;
    })
    .sort((a, b) => b.count - a.count);
}

// const mapViewApp = combineReducers({
//   cards,
//   visibilityFilter
// });
//
// export default mapViewApp;

function reducer(state = {}, action) {
  console.log('action', action);
  switch (action.type) {
    case SCREEN_RESIZE: {
      const { payload } = action;
      const { width, height } = payload;
      const h = height / 2;
      const newDim = {
        tagCloudWidth: width,
        tagCloudHeight: h / 2,
        tagMapWidth: width / 1.5,
        tagMapHeight: h,
        width,
        height
      };
      console.log('reducer newState', newDim);
      return { ...state, ...newDim };
    }
    // case PROCESS_DATA: {
    //   const { rawData } = state;
    //   const tagMapData = rawData.slice(0, 100).map(d => {
    //     if (typeof d.tags === 'string' || d.tags instanceof String)
    //       d.tags = d.tags.split(',');
    //     else {
    //       d.tags = [];
    //     }
    //     d.count = d.tags.length;
    //     return d;
    //   });
    //
    //   const sets = setify(tagMapData);
    //   return { ...state, tagMapData, sets };
    // }
    case FILTER_TIME: {
      const { payload } = action;
      const { minDate, maxDate } = payload;
      console.log('FILTER_TIME: ', payload);
      const tagMapData = state.data.filter(
        d => d.date > minDate && d.date < maxDate
      );

      const tagMapSets = setify(tagMapData);
      console.log('tagMapData: ', tagMapData);
      return { ...state, tagMapData, tagMapSets };
    }

    default:
      return state;
  }
}

export default reducer;
