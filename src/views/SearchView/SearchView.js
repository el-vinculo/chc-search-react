import React, { useState, useEffect, useRef } from 'react';
import { useSetRecoilState, useRecoilValue, useRecoilState } from 'recoil';
import { makeStyles } from '@material-ui/core/styles';
import _get from 'lodash/get';
import _isEmpty from 'lodash/isEmpty';
import _cloneDeep from 'lodash/cloneDeep';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Typography from '@material-ui/core/Typography';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import QueryBuilder from '../../components/QueryBuilder';
import SearchResults from '../../components/SearchResults';
import { AND, OR, AND_NOT, FILTER_TYPE } from '../../constants';
import { API } from '../../config';
import { httpRequest } from '../../utils';
import {
  isLoadingState,
  notificationAlertState,
  viewerSessionState,
  queryToLoadState,
} from '../../state';
import './SearchView.scss';

const ACCORDION_PANEL = {
  QUERY_BUILDER: 'query_builder',
  SEARCH_RESULTS: 'search_results',
};

const useStyles = makeStyles((theme) => ({
  heading: {
    fontSize: theme.typography.pxToRem(16),
    // flexBasis: '33.33%',
    flexShrink: 0,
    fontWeight: 600,
    paddingRight: theme.typography.pxToRem(20),
  },
  secondaryHeading: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.text.secondary,
  },
}));

export default function SearchView() {
  const classes = useStyles();

  const setLoading = useSetRecoilState(isLoadingState);
  const setNotificationAlert = useSetRecoilState(notificationAlertState);
  const viewerSession = useRecoilValue(viewerSessionState);
  const [queryToLoad, setQueryToLoad] = useRecoilState(queryToLoadState);

  const currentDt = new Date();
  const uniqueQueryName = useRef(
    `${
      _get(viewerSession, 'email')
        ? viewerSession.email.split('@')[0]
        : 'User_Query'
    }_${
      currentDt.getMonth() + 1
    }-${currentDt.getDate()}-${currentDt.getFullYear()}_${String(
      currentDt.getHours(),
    ).padStart(2, '0')}:${String(currentDt.getMinutes()).padStart(
      2,
      '0',
    )}:${String(currentDt.getSeconds()).padStart(2, '0')}`,
  );

  const [queryName, setQueryName] = useState(uniqueQueryName.current);
  const [searchResults, setSearchResults] = useState();
  const [tabResults, setTabResults] = useState([]);
  const [expandedPanel, setExpandedPanel] = useState(
    ACCORDION_PANEL.QUERY_BUILDER,
  );
  const [saveQueryAsGlobal, setSaveQueryAsGlobal] = useState(false);
  const [preloadedQueryJson, setPreloadedQueryJson] = useState();
  const [resultTab, setResultTab] = React.useState(0);

  const qbConfig = [
    {
      filterKey: 'GeoScope',
      filterLabel: 'Location',
      filterType: FILTER_TYPE.KEY_VALUE,
      keyOptions: [
        {
          key: 'Zipcode',
          label: 'ZIP Code',
          regex: /^\d{5}$/,
          regexErrorMessage: 'Please enter a 5-digit ZIP Code',
        },
        {
          key: 'City',
          label: 'City',
        },
        {
          key: 'State',
          label: 'State',
        },
        {
          key: 'County',
          label: 'County',
        },
        {
          key: 'EMPTY',
          label: 'National',
          nonChangeableValue: 'National',
        },
      ],
      multipleValuesAllowed: false,
    },
    {
      filterKey: 'PopGroupContainer',
      filterLabel: 'Population Groups Container',
      filterType: FILTER_TYPE.DROPDOWN,
      filterOptions: [
        // For Dropdowns if static, for dynamic use getter below
      ],
      getFilterOptions: async (filterStr) => {
        const response = await fetchFilterOptions(
          API.POPULATION_GROUP_OPTONS,
          filterStr,
        );
        return response.data.popg_list;
      },
      minCharsToFilter: 0,
      pullOptionsOnce: true,
      multipleValuesAllowed: true,
      joinsAllowedBetweenValues: [AND, OR, AND_NOT],
    },
    {
      filterKey: 'ServiceGroupsContainer',
      filterLabel: 'Service Groups Container',
      filterType: FILTER_TYPE.DROPDOWN,
      getFilterOptions: async (filterStr) => {
        const response = await fetchFilterOptions(
          API.SERVICE_GROUP_OPTONS,
          filterStr,
        );
        return response.data.sg_list;
      },
      minCharsToFilter: 0,
      pullOptionsOnce: true,
      multipleValuesAllowed: true,
      joinsAllowedBetweenValues: [AND, OR, AND_NOT],
    },
    {
      filterKey: 'ServiceTagsContainer',
      filterLabel: 'Service Tags Container',
      filterType: FILTER_TYPE.DROPDOWN,
      getFilterOptions: async (filterStr) => {
        const response = await fetchFilterOptions(
          API.SERVICE_TAG_OPTONS,
          filterStr,
        );
        return response.data.stg_list;
      },
      minCharsToFilter: 3,
      pullOptionsOnce: false,
      multipleValuesAllowed: true,
      joinsAllowedBetweenValues: [AND, OR, AND_NOT],
    },
    {
      filterKey: 'ProgDescr',
      filterLabel: 'Program',
      filterType: FILTER_TYPE.TEXT,
      multipleValuesAllowed: false,
      value: '',
    },
    {
      filterKey: 'name',
      filterLabel: 'Organization',
      filterType: FILTER_TYPE.TEXT,
      multipleValuesAllowed: false,
      value: '',
    },
    {
      filterKey: 'List_Guides',
      parentKey: 'ServiceGroupsContainer',
      filterLabel: 'Lists & Guides',
      filterType: FILTER_TYPE.SWITCH,
      value: false,
    },
  ];

  const fetchFilterOptions = async (filterKey, filterStr = '') => {
    if (_isEmpty(viewerSession)) {
      setNotificationAlert({
        type: 'error',
        msg: 'Please login and try again',
      });
      return null;
    }
    try {
      // setLoading(true);
      const response = await httpRequest({
        method: 'post',
        endpoint: filterKey,
        data: {
          email: viewerSession.email,
          search_params: {
            text: filterStr,
          },
        },
      });
      // setLoading(false);
      return response;
    } catch (err) {
      console.error('Error calling API', err);
      setNotificationAlert({
        type: 'error',
        msg: 'Error fetching data',
      });
      // setLoading(false);
      return err;
    }
  };

  const searchData = async (filters) => {
    if (_isEmpty(viewerSession)) {
      setNotificationAlert({
        type: 'error',
        msg: 'Please login and try again',
      });
      return;
    }
    try {
      setLoading(true);
      const response = await httpRequest({
        method: 'post',
        endpoint: API.SEARCH_DATA,
        data: {
          email: viewerSession.email,
          query_name: queryName,
          global_query: saveQueryAsGlobal,
          search_params: filters,
        },
      });
      setLoading(false);
      setExpandedPanel(ACCORDION_PANEL.SEARCH_RESULTS);
      setSearchResults(response.data);
      if (!Array.isArray(response.data.complete_result)) {
        const resultKeys = Object.keys(response.data.complete_result);
        let tabResult = null;
        resultKeys.forEach((k) => {
          if (!tabResult && Array.isArray(response.data.complete_result[k])) {
            tabResult = response.data.complete_result[k];
          }
        });
        if (tabResult) {
          setTabResults(tabResult);
        }
      }
    } catch (err) {
      console.error('Error calling API', err);
      setNotificationAlert({
        type: 'error',
        msg: 'Error searching data',
      });
      setLoading(false);
    }
  };

  const toggleExpandedPanel = (panel) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  useEffect(() => {
    const currentDate = new Date();
    setQueryName(
      `${
        _get(viewerSession, 'email')
          ? viewerSession.email.split('@')[0]
          : 'User_Query'
      }_${
        currentDate.getMonth() + 1
      }-${currentDate.getDate()}-${currentDate.getFullYear()}_${String(
        currentDate.getHours(),
      ).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(
        2,
        '0',
      )}:${String(currentDate.getSeconds()).padStart(2, '0')}`,
    );
  }, [viewerSession]);

  useEffect(() => {
    if (queryToLoad) {
      setQueryName(queryToLoad.query_name);
      setSaveQueryAsGlobal(queryToLoad.global);
      const transformedQueryJson = _cloneDeep(queryToLoad.query_hash);
      if (
        transformedQueryJson.ServiceGroupsContainer &&
        transformedQueryJson.ServiceGroupsContainer.length > 0
      ) {
        const listAndGuides = transformedQueryJson.ServiceGroupsContainer.find(
          (sg) => sg.value === 'Lists & Guides',
        );
        if (listAndGuides) {
          transformedQueryJson.ServiceGroupsContainer.splice(
            transformedQueryJson.ServiceGroupsContainer.indexOf(listAndGuides),
            1,
          );
          if (transformedQueryJson.ServiceGroupsContainer.length === 0) {
            delete transformedQueryJson.ServiceGroupsContainer;
          }
          transformedQueryJson.List_Guides = listAndGuides.modifier === 'False';
        }
      }
      Object.keys(transformedQueryJson).forEach((fk) => {
        if (Array.isArray(transformedQueryJson[fk])) {
          transformedQueryJson[fk].forEach((val, idx) => {
            val.id = idx + 1;
          });
        }
      });
      setPreloadedQueryJson(transformedQueryJson);
    } else {
      setPreloadedQueryJson();
    }
  }, [queryToLoad]);

  const handleResultTabChange = (event, newValue) => {
    event.stopPropagation();
    setResultTab(newValue);
    const tabKeys = Object.keys(searchResults.complete_result);
    const tabsData = [];
    tabKeys.forEach((k) => {
      if (Array.isArray(searchResults.complete_result[k])) {
        tabsData.push(searchResults.complete_result[k]);
      }
    });
    setTabResults(tabsData[newValue]);
  };

  return (
    <div className="search-view-container">
      <Accordion
        expanded={expandedPanel === ACCORDION_PANEL.QUERY_BUILDER}
        onChange={toggleExpandedPanel(ACCORDION_PANEL.QUERY_BUILDER)}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="query_builder-content"
          id="query_builder-header"
        >
          <Typography className={classes.heading}>
            Select Service Providers
          </Typography>
          <Typography className={classes.secondaryHeading}>
            {queryName}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <div
            className="query-builder-wrapper"
            style={{
              display:
                expandedPanel === ACCORDION_PANEL.QUERY_BUILDER
                  ? 'block'
                  : 'none',
            }}
          >
            <QueryBuilder
              config={qbConfig}
              joinsAllowedBetweenFilters={[AND]}
              onSubmit={(qbObj) => searchData(qbObj)}
              queryName={{
                key: 'query_name',
                // defaultValue: uniqueQueryName.current,
                defaultValue: queryName,
                onChange: (val) => setQueryName(val),
                defaultQueryName: uniqueQueryName.current,
              }}
              saveQueryAsGlobal={{
                key: 'global_query',
                value: saveQueryAsGlobal,
                onChange: (val) => setSaveQueryAsGlobal(val),
              }}
              onReset={() => setQueryToLoad()}
              // staticConfig={qbStaticConfig}
              defaultQueryJson={preloadedQueryJson}
            />
          </div>
        </AccordionDetails>
      </Accordion>
      {searchResults && (
        <Accordion
          expanded={expandedPanel === ACCORDION_PANEL.SEARCH_RESULTS}
          onChange={toggleExpandedPanel(ACCORDION_PANEL.SEARCH_RESULTS)}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="search_results-content"
            id="search_results-header"
          >
            <Typography className={classes.heading}>Search Results</Typography>
            {Array.isArray(searchResults.complete_result) && (
              <Typography className={classes.secondaryHeading}>
                {searchResults.result_count} Found
              </Typography>
            )}
            {!Array.isArray(searchResults.complete_result) && (
              <div className="tabs-wrap">
                <Tabs
                  value={resultTab}
                  onChange={handleResultTabChange}
                  aria-label="result tabs"
                  indicatorColor="primary"
                >
                  {Object.keys(searchResults.complete_result).map((k) => {
                    if (Array.isArray(searchResults.complete_result[k])) {
                      return (
                        <Tab
                          label={`${k} (${
                            searchResults.complete_result[`${k}_count`]
                          })`}
                          key={k}
                        />
                      );
                    }
                    return null;
                  })}
                </Tabs>
              </div>
            )}
          </AccordionSummary>
          <AccordionDetails>
            <div
              className="search-results-wrapper"
              style={{
                display:
                  expandedPanel === ACCORDION_PANEL.SEARCH_RESULTS
                    ? 'block'
                    : 'none',
              }}
            >
              <SearchResults
                data={
                  !Array.isArray(searchResults.complete_result)
                    ? tabResults
                    : searchResults.complete_result
                }
              />
            </div>
          </AccordionDetails>
        </Accordion>
      )}
    </div>
  );
}
