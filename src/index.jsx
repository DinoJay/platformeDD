import React from 'react';
import { AppContainer } from 'react-hot-loader';
import ReactDOM from 'react-dom';

import WebFont from 'webfontloader';
// import WebfontLoader from '@dr-kobros/react-webfont-loader';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.css';

import './styles/global/annotation.scss';
import './styles/global/index.scss';

import App from './components/App';
// import Routes from './Routes.jsx';
// import Routes from './Routes';

// import './index.scss';
// import CV from './components/CV';

const WebFontConfig = {
  google: {
    families: ['Slackey']
  }
};

const render = Component => {
  ReactDOM.render(
    <AppContainer>
      <Component />
    </AppContainer>,
    document.getElementById('app')
  );
};

WebFont.load({
  ...WebFontConfig,
  active() {
    render(App);
    if (module.hot) {
      module.hot.accept('./components/App', () => {
        render(App);
      });
    }
  }
});

// render(Routes);
// if (module.hot) {
//   module.hot.accept('./Routes', () => {
//     render(Routes);
//   });
// }
