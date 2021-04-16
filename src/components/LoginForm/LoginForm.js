import React, { useState } from 'react';
// import PropTypes from 'prop-types';
import clsx from 'clsx';
import _isEmpty from 'lodash/isEmpty';
import _trim from 'lodash/trim';
// import _get from 'lodash/get';
import { useSetRecoilState } from 'recoil';
import { makeStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import InputLabel from '@material-ui/core/InputLabel';
import InputAdornment from '@material-ui/core/InputAdornment';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slide from '@material-ui/core/Slide';
import FormControl from '@material-ui/core/FormControl';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

import {
  isLoadingState,
  notificationAlertState,
  viewerSessionState,
  showUserLoginState,
} from '../../state';
import { httpRequest } from '../../utils';
import { API } from '../../config';
import './LoginForm.scss';

const useStyles = makeStyles((theme) => ({
  margin: {
    margin: theme.spacing(1),
  },
  textField: {
    width: '250px',
  },
  loginBtn: {
    width: '250px',
  },
  errorMsg: {
    paddingLeft: '8px',
    paddingRight: '8px',
    fontSize: '14px',
  },
}));

const Transition = React.forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));

export default function LoginForm() {
  const classes = useStyles();

  const setLoading = useSetRecoilState(isLoadingState);
  const setNotificationAlert = useSetRecoilState(notificationAlertState);
  const setUserSession = useSetRecoilState(viewerSessionState);
  const setShowUserLogin = useSetRecoilState(showUserLoginState);

  const [error, setError] = useState(null);

  const [values, setValues] = useState({
    password: '',
    email: '',
    showPassword: false,
  });

  const handleChange = (prop) => (event) => {
    setValues({ ...values, [prop]: event.target.value });
    setError(null);
  };

  const handleClickShowPassword = () => {
    setValues({ ...values, showPassword: !values.showPassword });
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleUserLogin = async () => {
    if (!_isEmpty(_trim(values.email)) && !_isEmpty(_trim(values.password))) {
      try {
        setLoading(true);
        const response = await httpRequest({
          endpoint: API.LOGIN_USER,
          method: 'post',
          data: {
            email: values.email,
            password: values.password,
          },
          // data: {
          //   search_params: {
          //     text: '',
          //   },
          // },
        });

        if (response.data.authentication_token && response.data.email) {
          const userAccess = {
            token: response.data.authentication_token,
            email: response.data.email,
          };
          setUserSession(userAccess);
          localStorage.setItem('userSession', JSON.stringify(userAccess));
          setShowUserLogin(false);
          setNotificationAlert({
            type: 'success',
            msg: 'User logged in',
          });
        } else {
          throw new Error('User deactivated');
        }
        setLoading(false);
      } catch (err) {
        console.error('API Call Failed: ', err);
        setLoading(false);
        setNotificationAlert({
          type: 'error',
          msg: 'Error authenticating user. Please check credentials.',
        });
      }
    } else {
      setError('Please enter credentials to login');
    }
  };

  return (
    <Dialog
      open
      TransitionComponent={Transition}
      keepMounted
      maxWidth="sm"
      // onClose={() => setShowUserLogin(false)}
      className="user-login-form"
      aria-labelledby="alert-dialog-slide-title"
      aria-describedby="alert-dialog-slide-description"
    >
      <DialogTitle id="alert-dialog-slide-title">User Login</DialogTitle>
      <DialogContent>
        <div className="login-form">
          <div className="input-row">
            <FormControl
              className={clsx(classes.margin, classes.textField)}
              variant="outlined"
            >
              <InputLabel htmlFor="standard-email">Email</InputLabel>
              <OutlinedInput
                id="standard-email"
                type="text"
                value={values.email}
                onChange={handleChange('email')}
                labelWidth={60}
              />
            </FormControl>
          </div>
          <div className="input-row">
            <FormControl
              className={clsx(classes.margin, classes.textField)}
              variant="outlined"
            >
              <InputLabel htmlFor="outlined-adornment-password">
                Password
              </InputLabel>
              <OutlinedInput
                id="outlined-adornment-password"
                type={values.showPassword ? 'text' : 'password'}
                value={values.password}
                onChange={handleChange('password')}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {values.showPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                }
                labelWidth={75}
              />
            </FormControl>
          </div>
          {error && (
            <Typography color="error" className={classes.errorMsg}>
              {error}
            </Typography>
          )}
        </div>
      </DialogContent>
      <DialogActions>
        {/* <Button onClick={() => setShowUserLogin(false)} color="primary">
          Cancel
        </Button> */}
        <Button onClick={handleUserLogin} color="primary">
          Login
        </Button>
      </DialogActions>
    </Dialog>
  );
}
