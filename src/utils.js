import axios from 'axios';
import _isEmpty from 'lodash/isEmpty';
import { DEFAULT } from './config';

const defaultBaseURL = process.env.REACT_APP_SERVER_URL || DEFAULT.BASE_URL;

export const httpRequest = (
  apiConfig = {
    method: 'get',
    endpoint: null,
    headers: {},
    data: null,
  },
) =>
  new Promise((resolve, reject) => {
    const headers = {
      'content-type': 'application/json',
      // Authorization: DEFAULT.AUTH_TOKEN,
      ...apiConfig.headers,
    };

    if (localStorage.getItem('userSession')) {
      const userSession = JSON.parse(localStorage.getItem('userSession'));
      if (!_isEmpty(userSession)) {
        headers['user-token'] = userSession.token;
      }
    }

    axios({
      method: apiConfig.method,
      url: defaultBaseURL + apiConfig.endpoint,
      headers,
      data: apiConfig.data,
    }).then(
      (res) => {
        resolve(res);
      },
      (err) => {
        reject(err.response);
      },
    );
  });
