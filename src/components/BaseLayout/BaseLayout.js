import React, { useState, useEffect, Suspense, lazy } from 'react';
import clsx from 'clsx';
import {
  Switch,
  Route,
  Redirect,
  useLocation,
  NavLink,
  // useParams,
  // useRouteMatch,
} from 'react-router-dom';
import _isEmpty from 'lodash/isEmpty';
import { useRecoilState, useRecoilValue } from 'recoil';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import CssBaseline from '@material-ui/core/CssBaseline';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import SearchIcon from '@material-ui/icons/Search';
import BookmarksIcon from '@material-ui/icons/Bookmarks';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';

import {
  isLoadingState,
  notificationAlertState,
  viewerSessionState,
  showUserLoginState,
} from '../../state';
import NoMatch from '../NoMatch';
import ErrorBoundary from '../ErrorBoundary';
import Loader from '../Loader';
import LoginForm from '../LoginForm';

const SearchView = lazy(() => import('../../views/SearchView'));
const SavedQueriesView = lazy(() => import('../../views/SavedQueriesView'));

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  appBar: {
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  hide: {
    display: 'none',
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: 'flex-end',
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: -drawerWidth,
  },
  contentShift: {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  },
  listItemLink: {
    textDecoration: 'none',
    color: 'rgba(0, 0, 0, 0.87)',
  },
  menuWrap: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  leftCol: {
    display: 'flex',
    alignItems: 'center',
  },
}));

export default function PersistentDrawerLeft() {
  const classes = useStyles();
  const theme = useTheme();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [accountAnchorEl, setAccountAnchorEl] = useState(null);

  const isLoading = useRecoilValue(isLoadingState);
  const [notificationAlert, setNotificationAlert] = useRecoilState(
    notificationAlertState,
  );
  const [viewerSession, setViewerSession] = useRecoilState(viewerSessionState);
  const [showUserLogin, setShowUserLogin] = useRecoilState(showUserLoginState);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleAccountClick = (event) => {
    if (viewerSession) {
      setAccountAnchorEl(event.currentTarget);
    } else {
      setShowUserLogin(true);
    }
  };

  const handleAccountClose = () => {
    setAccountAnchorEl(null);
  };

  useEffect(() => {
    const viewerSessionFromLS = localStorage.getItem('userSession');
    if (viewerSessionFromLS) {
      setViewerSession(JSON.parse(viewerSessionFromLS));
    } else {
      setShowUserLogin(true);
    }
  }, [setShowUserLogin, setViewerSession]);

  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar
        position="fixed"
        className={clsx(classes.appBar, {
          [classes.appBarShift]: open,
        })}
      >
        <Toolbar className={classes.menuWrap}>
          <div className={classes.leftCol}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerOpen}
              edge="start"
              className={clsx(classes.menuButton, open && classes.hide)}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap>
              Common Healthcore
            </Typography>
          </div>
          <div className={classes.rightCol}>
            <IconButton
              color="inherit"
              aria-label="Account"
              edge="end"
              onClick={(e) => handleAccountClick(e)}
            >
              <AccountCircleIcon />
            </IconButton>
            <Menu
              id="account-menu"
              anchorEl={accountAnchorEl}
              keepMounted
              open={Boolean(accountAnchorEl)}
              onClose={handleAccountClose}
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              classes={{ paper: classes.menu, list: classes.menuList }}
              // hideBackdrop
            >
              {!_isEmpty(viewerSession) && (
                <MenuItem>{viewerSession.email}</MenuItem>
              )}
              <MenuItem
                onClick={() => {
                  localStorage.removeItem('userSession');
                  // localStorage.removeItem('csrf');
                  setViewerSession();
                  setNotificationAlert({
                    type: 'success',
                    msg: `Logged out.`,
                  });
                  setShowUserLogin(true);
                  handleAccountClose();
                }}
              >
                Logout
              </MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>
      <Drawer
        className={classes.drawer}
        variant="persistent"
        anchor="left"
        open={open}
        classes={{
          paper: classes.drawerPaper,
        }}
      >
        <div className={classes.drawerHeader}>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'ltr' ? (
              <ChevronLeftIcon />
            ) : (
              <ChevronRightIcon />
            )}
          </IconButton>
        </div>
        <Divider />
        <List>
          <NavLink to="/" className={classes.listItemLink}>
            <ListItem button selected={location.pathname === '/'}>
              <ListItemIcon>
                <SearchIcon />
              </ListItemIcon>
              <ListItemText primary="Search Records" />
            </ListItem>
          </NavLink>
          <NavLink to="/saved-queries" className={classes.listItemLink}>
            <ListItem button selected={location.pathname === '/saved-queries'}>
              <ListItemIcon>
                <BookmarksIcon />
              </ListItemIcon>
              <ListItemText primary="Saved Queries" />
            </ListItem>
          </NavLink>
        </List>
      </Drawer>
      <main
        className={clsx(classes.content, {
          [classes.contentShift]: open,
        })}
      >
        <div className={classes.drawerHeader} />
        <ErrorBoundary>
          <Suspense fallback={null}>
            <Switch>
              <Redirect from="/:url*(/+)" to={location.pathname.slice(0, -1)} />
              <Route exact path="/">
                <SearchView />
              </Route>
              <Route exact path="/saved-queries">
                <SavedQueriesView />
              </Route>
              <Route exact path="/not-found">
                <NoMatch />
              </Route>
              <Redirect to="/not-found" />
            </Switch>
          </Suspense>
        </ErrorBoundary>
      </main>
      {showUserLogin && <LoginForm />}
      {isLoading && <Loader />}
      {notificationAlert && (
        <Snackbar
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          open
          autoHideDuration={6000}
          onClose={() => setNotificationAlert()}
          onExited={() => setNotificationAlert()}
        >
          <MuiAlert
            elevation={6}
            variant="filled"
            onClose={() => setNotificationAlert()}
            severity={notificationAlert.type}
          >
            {notificationAlert.msg}
          </MuiAlert>
        </Snackbar>
      )}
    </div>
  );
}
