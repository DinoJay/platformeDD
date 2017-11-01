/*
 * action types
 */

export const SCREEN_RESIZE = 'SCREEN_RESIZE';
export const PROCESS_DATA = 'PROCESS_DATA';
export const FILTER_TIME = 'FILTER_TIME';
// export const SET_VISIBILITY_FILTER = 'SET_VISIBILITY_FILTER'

/*
 * other constants
 */

// export const VisibilityFilters = {
//   SHOW_ALL: 'SHOW_ALL',
//   SHOW_COMPLETED: 'SHOW_COMPLETED',
//   SHOW_ACTIVE: 'SHOW_ACTIVE'
// }

/*
 * action creators
 */

export function screenResize(payload) {
  return { type: SCREEN_RESIZE, payload };
}

export function processData(payload) {
  return { type: PROCESS_DATA, payload };
}

export function filterTime(payload) {
  return { type: FILTER_TIME, payload };
}

// export function toggleTodo(index) {
//   return { type: TOGGLE_TODO, index };
// }
//
// export function setVisibilityFilter(filter) {
//   return { type: SET_VISIBILITY_FILTER, filter };
// }
