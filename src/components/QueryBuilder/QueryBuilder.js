import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import _isEmpty from 'lodash/isEmpty';
import _find from 'lodash/find';
import _findIndex from 'lodash/findIndex';
import _pick from 'lodash/pick';
import _omit from 'lodash/omit';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Autocomplete from '@material-ui/lab/Autocomplete';
import CircularProgress from '@material-ui/core/CircularProgress';
import Switch from '@material-ui/core/Switch';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import RemoveCircleIcon from '@material-ui/icons/RemoveCircle';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import PlaylistAddIcon from '@material-ui/icons/PlaylistAdd';
import ClearAllIcon from '@material-ui/icons/ClearAll';
import SearchIcon from '@material-ui/icons/Search';
import { AND, AND_NOT, FILTER_TYPE, MODIFIER } from '../../constants';
import './QueryBuilder.scss';

export default function QueryBuilder({
  config,
  onSubmit,
  joinsAllowedBetweenFilters,
  queryName,
  // staticConfig = [],
  saveQueryAsGlobal,
  onReset,
  defaultQueryJson,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [appliedFilters, setAppliedFilters] = useState([]);
  const [queryJson, setQueryJson] = useState({});
  const [openDropdown, setOpenDrodpown] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState([]);
  const [dropdownInput, setDropdownInput] = useState('');
  const [errors, setErrors] = useState({});
  // const [qbStaticConfig, setQbStaticConfig] = useState(staticConfig);

  /* const [searchQueryName, setSearchQueryName] = useState(
    queryName && queryName.defaultValue,
  ); */

  const apiDebounce = useRef(null);
  const prevDropdownInput = useRef('');
  const prevOpenDropdown = useRef(false);

  const dropdownLoading =
    openDropdown && dropdownOptions && dropdownOptions.length === 0;

  useEffect(() => {
    if (defaultQueryJson) {
      setQueryJson(defaultQueryJson);
      const filterKeys = Object.keys(defaultQueryJson);
      setAppliedFilters(
        config.filter((category) => filterKeys.includes(category.filterKey)),
      );
      setErrors({});
    } else {
      const preloadFilters = config.filter((fk) => fk.preload);
      setAppliedFilters(preloadFilters);
      const preloadQueryJson = {};
      preloadFilters.forEach((pf) => {
        preloadQueryJson[pf.filterKey] = initialFilterValue(pf);
        setTimeout(() => {
          if (document.querySelector(`#${pf.filterKey}`)) {
            document.querySelector(`#${pf.filterKey}`).focus();
          }
        }, 100);
      });
      setQueryJson(preloadQueryJson);
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultQueryJson]);

  const handleQueryReset = () => {
    const preloadFilters = config.filter((fk) => fk.preload);
    setAppliedFilters(preloadFilters);
    const preloadQueryJson = {};
    preloadFilters.forEach((pf) => {
      preloadQueryJson[pf.filterKey] = initialFilterValue(pf);
      setTimeout(() => {
        if (document.querySelector(`#${pf.filterKey}`)) {
          document.querySelector(`#${pf.filterKey}`).focus();
        }
      }, 100);
    });
    setQueryJson(preloadQueryJson);
    const defaultName = queryName && queryName.defaultQueryName;
    // setSearchQueryName(defaultName);
    if (queryName && queryName.onChange) {
      queryName.onChange(defaultName);
    }
    setErrors({});
    if (onReset) {
      onReset();
    }
  };

  const handleAddFilterCategoryClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleAddFilterCategoryClose = () => {
    setAnchorEl(null);
  };

  const initialFilterValue = (filterCategory) => {
    switch (filterCategory.filterType) {
      case FILTER_TYPE.DROPDOWN: {
        return [
          {
            id: 1,
            value: '',
            modifier: MODIFIER.DEFAULT,
            connector: '',
          },
        ];
      }
      case FILTER_TYPE.TEXT:
      case FILTER_TYPE.SWITCH: {
        return filterCategory.value;
      }
      case FILTER_TYPE.KEY_VALUE: {
        return {
          value: '',
          type: filterCategory.keyOptions[0].key,
        };
      }
      default:
        return null;
    }
  };

  const addFilterCategory = (category) => {
    setAppliedFilters([...appliedFilters, category]);

    setQueryJson((prev) => ({
      ...prev,
      [category.filterKey]: initialFilterValue(category),
    }));
    setTimeout(() => {
      if (document.querySelector(`#${category.filterKey}`)) {
        document.querySelector(`#${category.filterKey}`).focus();
      }
    });
    handleAddFilterCategoryClose();
  };

  const removeFilterCategory = (filterKey) => {
    const updatedAppliedFilters = [...appliedFilters];
    updatedAppliedFilters.splice(
      _findIndex(updatedAppliedFilters, { filterKey }),
      1,
    );
    setAppliedFilters(updatedAppliedFilters);
    setQueryJson(_omit(queryJson, filterKey));
  };

  const addFilterValue = (filterKey) => {
    let valIdx = 1;
    if (queryJson[filterKey].length > 0) {
      valIdx = queryJson[filterKey][queryJson[filterKey].length - 1].id + 1;
    }

    setQueryJson((prev) => ({
      ...prev,
      [filterKey]: [
        ...prev[filterKey],
        {
          id: valIdx,
          value: '',
          modifier: MODIFIER.DEFAULT,
          connector: AND,
        },
      ],
    }));
  };

  const removeFilterValue = (filterKey, idx) => {
    const updatedFilterValues = [...queryJson[filterKey]];
    updatedFilterValues.splice(_findIndex(updatedFilterValues, { id: idx }), 1);

    setQueryJson((prev) => ({
      ...prev,
      [filterKey]: updatedFilterValues,
    }));
  };

  const handleConnectorChange = (filterKey, idx, connectorValue) => {
    const updatedFilterValues = [...queryJson[filterKey]];
    const valObj = _find(updatedFilterValues, { id: idx });
    if (connectorValue.toUpperCase() === AND_NOT) {
      valObj.connector = AND;
      valObj.modifier = MODIFIER.NOT;
    } else {
      valObj.connector = connectorValue;
      valObj.modifier = MODIFIER.DEFAULT;
    }

    setQueryJson((prev) => ({
      ...prev,
      [filterKey]: updatedFilterValues,
    }));
  };

  const handleFilterValueChange = (
    filterKey,
    idx,
    filterValue,
    valueKey = 'value',
  ) => {
    const updatedFilterValues = [...queryJson[filterKey]];
    const valObj = _find(updatedFilterValues, { id: idx });
    valObj[valueKey] = filterValue || '';

    setErrors((prev) => ({
      ...prev,
      [`${filterKey}|${idx}`]: false,
    }));

    setQueryJson((prev) => ({
      ...prev,
      [filterKey]: updatedFilterValues,
    }));
  };

  useEffect(() => {
    // let active = true;
    if (!dropdownLoading) {
      return;
    }

    if (apiDebounce.current) {
      clearTimeout(apiDebounce.current);
    }

    apiDebounce.current = setTimeout(async () => {
      const filterKey = openDropdown.split('|')[0];
      const filterConfigObj = appliedFilters.find(
        (f) => f.filterKey === filterKey,
      );
      if (
        filterConfigObj.pullOptionsOnce &&
        dropdownOptions &&
        dropdownOptions.length > 0
      ) {
        return;
      }
      if (dropdownInput.length >= (filterConfigObj.minCharsToFilter || 0)) {
        const ddOptions = await filterConfigObj.getFilterOptions(
          filterConfigObj.pullOptionsOnce ? '' : dropdownInput,
        );
        // if (active) {
        setDropdownOptions(ddOptions.length > 0 ? ddOptions : null);
        // }
      }
      apiDebounce.current = null;
    }, 300);

    // return () => {
    //   active = false;
    // };
  }, [
    dropdownLoading,
    dropdownInput,
    openDropdown,
    appliedFilters,
    dropdownOptions,
  ]);

  useEffect(() => {
    if (!openDropdown || (openDropdown && prevOpenDropdown !== openDropdown)) {
      // if (!openDropdown) {
      setDropdownOptions([]);
      setDropdownInput('');
    }
    prevOpenDropdown.current = openDropdown;
  }, [openDropdown]);

  useEffect(() => {
    if (prevDropdownInput.current.length > dropdownInput.length) {
      setDropdownOptions([]);
    }
    prevDropdownInput.current = dropdownInput;
  }, [dropdownInput]);

  const handleQuerySearch = () => {
    const validationErrors = {};
    const requestFilters = {};
    Object.keys(queryJson).forEach((filterKey) => {
      const filterConfig = appliedFilters.find(
        (f) => f.filterKey === filterKey,
      );
      if (!filterConfig.parentKey) {
        if (Array.isArray(queryJson[filterKey])) {
          if (queryJson[filterKey].length > 0) {
            requestFilters[filterKey] = [];
          }
          queryJson[filterKey].forEach((filterVal, i) => {
            if (_isEmpty(filterVal.value)) {
              validationErrors[`${filterKey}|${filterVal.id}`] = true;
            }
            const filterValObj = _pick(filterVal, [
              'value',
              'modifier',
              'connector',
            ]);
            if (i === 0) {
              filterValObj.modifier = 'False';
              filterValObj.connector = '';
            }
            requestFilters[filterKey].push(filterValObj);
          });
        } else if (
          queryJson[filterKey] &&
          !_isEmpty(queryJson[filterKey].type)
        ) {
          const keyConfig = filterConfig.keyOptions.find(
            (k) => k.key === queryJson[filterKey].type,
          );
          if (
            !('nonChangeableValue' in keyConfig) &&
            _isEmpty(queryJson[filterKey].value)
          ) {
            validationErrors[filterKey] = true;
          } else if (
            'regex' in keyConfig &&
            !keyConfig.regex.test(queryJson[filterKey].value)
          ) {
            validationErrors[filterKey] = keyConfig.regexErrorMessage;
          } else {
            const filterVal = { ...queryJson[filterKey] };
            if (filterVal.type === 'EMPTY') {
              filterVal.type = '';
            }
            requestFilters[filterKey] = filterVal;
          }
        } else {
          if (_isEmpty(queryJson[filterKey])) {
            validationErrors[filterKey] = true;
          }
          requestFilters[filterKey] = queryJson[filterKey];
        }
      }
    });

    Object.keys(queryJson).forEach((filterKey) => {
      const filterConfig = appliedFilters.find(
        (f) => f.filterKey === filterKey,
      );
      if (filterConfig.parentKey) {
        if (!requestFilters[filterConfig.parentKey]) {
          requestFilters[filterConfig.parentKey] = [];
          requestFilters[filterConfig.parentKey].push({
            value: filterConfig.filterLabel,
            modifier: queryJson[filterKey] ? MODIFIER.DEFAULT : MODIFIER.NOT,
            connector: '',
          });
        } else {
          requestFilters[filterConfig.parentKey].push({
            value: filterConfig.filterLabel,
            modifier: queryJson[filterKey] ? MODIFIER.DEFAULT : MODIFIER.NOT,
            connector: AND,
          });
        }
      }
    });

    // qbStaticConfig.forEach((filterConfig) => {
    //   if (!requestFilters[filterConfig.filterKey]) {
    //     requestFilters[filterConfig.filterKey] = [];
    //     requestFilters[filterConfig.filterKey].push({
    //       value: filterConfig.filterLabel,
    //       modifier: filterConfig.value ? MODIFIER.DEFAULT : MODIFIER.NOT,
    //       connector: '',
    //     });
    //   } else {
    //     requestFilters[filterConfig.filterKey].push({
    //       value: filterConfig.filterLabel,
    //       modifier: filterConfig.value ? MODIFIER.DEFAULT : MODIFIER.NOT,
    //       connector: AND,
    //     });
    //   }
    // });
    // if (queryName && _isEmpty(searchQueryName)) {
    if (queryName && _isEmpty(queryName.defaultValue)) {
      validationErrors[queryName.key] = true;
    } else {
      // requestFilters[queryName.key] = queryName.defaultValue;
    }
    if (_isEmpty(validationErrors)) {
      onSubmit(requestFilters);
    } else {
      setErrors(validationErrors);
    }
  };

  const filterCategoriesList = config.filter(
    (category) =>
      !appliedFilters.find((af) => af.filterKey === category.filterKey),
  );

  return (
    <div className="query-builder-container">
      {appliedFilters.map(
        (filter, i) =>
          filter.filterKey in queryJson && (
            <div className="filter-group" key={filter.filterKey}>
              <div
                className="remove-filter"
                onClick={() => removeFilterCategory(filter.filterKey)}
                role="presentation"
              >
                <RemoveCircleIcon color="error" />
              </div>
              <div className="filter-category-join">
                {i > 0
                  ? joinsAllowedBetweenFilters.length === 1 &&
                    joinsAllowedBetweenFilters[0]
                  : ''}
              </div>
              <div className="filter-label">{filter.filterLabel}</div>
              {filter.filterType === FILTER_TYPE.DROPDOWN && (
                <div className="filter-values-wrap">
                  {queryJson[filter.filterKey].map((val, idx) => (
                    <React.Fragment key={val.id}>
                      {idx > 0 && (
                        <div className="filter-connector">
                          <Select
                            // value={queryJson[filter.filterKey][idx - 1].connector}
                            value={
                              val.connector === AND &&
                              val.modifier === MODIFIER.NOT
                                ? AND_NOT
                                : val.connector
                            }
                            onChange={(e) =>
                              handleConnectorChange(
                                filter.filterKey,
                                val.id,
                                e.target.value,
                              )
                            }
                            displayEmpty
                            // className={classes.selectEmpty}
                          >
                            {filter.joinsAllowedBetweenValues.map((join) => (
                              <MenuItem value={join} key={join}>
                                {join.toUpperCase()}
                              </MenuItem>
                            ))}
                          </Select>
                        </div>
                      )}
                      <div className="filter-value">
                        {filter.multipleValuesAllowed && (
                          <div
                            className="filter-value-remove"
                            onClick={() =>
                              removeFilterValue(filter.filterKey, val.id)
                            }
                            role="presentation"
                          >
                            <HighlightOffIcon color="error" />
                          </div>
                        )}
                        <Autocomplete
                          id={`${filter.filterKey}|${val.id}`}
                          style={{ width: 200 }}
                          size="small"
                          // autoComplete
                          autoHighlight
                          autoSelect
                          open={
                            openDropdown === `${filter.filterKey}|${val.id}`
                          }
                          onOpen={() => {
                            setOpenDrodpown(`${filter.filterKey}|${val.id}`);
                            setDropdownInput(val.value);
                          }}
                          onClose={() => {
                            setOpenDrodpown(false);
                          }}
                          onChange={(e, value) => {
                            handleFilterValueChange(
                              filter.filterKey,
                              val.id,
                              value,
                            );
                          }}
                          inputValue={
                            !_isEmpty(dropdownInput) &&
                            openDropdown === `${filter.filterKey}|${val.id}`
                              ? dropdownInput
                              : val.value
                            // val.value
                          }
                          onInputChange={(e, value, reason) => {
                            if (reason !== 'reset') {
                              const inputVal = value || '';
                              setDropdownInput(inputVal);
                              if (_isEmpty(inputVal)) {
                                handleFilterValueChange(
                                  filter.filterKey,
                                  val.id,
                                  inputVal,
                                );
                              }
                            }
                          }}
                          getOptionSelected={(option, value) =>
                            // option.name === value.name
                            option === value
                          }
                          // getOptionLabel={(option) => option.name}
                          options={
                            dropdownOptions
                              ? dropdownOptions.filter(
                                  (opt) =>
                                    !queryJson[filter.filterKey]
                                      .map(
                                        (fVal) =>
                                          fVal.value !== val.value &&
                                          fVal.value,
                                      )
                                      .includes(opt),
                                )
                              : []
                          }
                          // options={dropdownOptions}
                          loading={
                            dropdownLoading &&
                            openDropdown === `${filter.filterKey}|${val.id}` &&
                            dropdownInput.length >=
                              appliedFilters.find(
                                (af) => af.filterKey === filter.filterKey,
                              ).minCharsToFilter
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Select/Search..."
                              variant="outlined"
                              error={errors[`${filter.filterKey}|${val.id}`]}
                              helperText={
                                errors[`${filter.filterKey}|${val.id}`] &&
                                'Please select a value'
                              }
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <React.Fragment>
                                    {dropdownLoading &&
                                    openDropdown ===
                                      `${filter.filterKey}|${val.id}` &&
                                    dropdownInput.length >=
                                      appliedFilters.find(
                                        (af) =>
                                          af.filterKey === filter.filterKey,
                                      ).minCharsToFilter ? (
                                      <CircularProgress
                                        color="inherit"
                                        size={20}
                                      />
                                    ) : null}
                                    {params.InputProps.endAdornment}
                                  </React.Fragment>
                                ),
                              }}
                            />
                          )}
                        />
                      </div>
                    </React.Fragment>
                  ))}
                  {filter.multipleValuesAllowed && (
                    <div
                      className="add-filter-value"
                      onClick={() => addFilterValue(filter.filterKey)}
                      role="presentation"
                    >
                      <AddCircleOutlineIcon />
                    </div>
                  )}
                </div>
              )}
              {filter.filterType === FILTER_TYPE.TEXT && (
                <div className="filter-text-value">
                  <TextField
                    id={filter.filterKey}
                    placeholder="Enter..."
                    variant="outlined"
                    style={{
                      width: 300,
                    }}
                    size="small"
                    value={queryJson[filter.filterKey]}
                    error={errors[filter.filterKey]}
                    helperText={
                      errors[filter.filterKey] && 'Please enter a value'
                    }
                    onChange={(e) => {
                      setErrors((prev) => ({
                        ...prev,
                        [filter.filterKey]: false,
                      }));
                      setQueryJson((prev) => ({
                        ...prev,
                        [filter.filterKey]: e.target.value,
                      }));
                    }}
                  />
                </div>
              )}
              {filter.filterType === FILTER_TYPE.KEY_VALUE && (
                <div className="filter-key-value">
                  <div className="filter-value">
                    <div className="filter-value-key">
                      <Select
                        value={queryJson[filter.filterKey].type}
                        style={{ width: '100px' }}
                        onChange={(e) => {
                          const keyConfigObj = filter.keyOptions.find(
                            (k) => k.key === e.target.value,
                          );
                          setQueryJson((prev) => ({
                            ...prev,
                            [filter.filterKey]: {
                              type: e.target.value,
                              value:
                                'nonChangeableValue' in keyConfigObj
                                  ? keyConfigObj.nonChangeableValue
                                  : // : prev[filter.filterKey].value,
                                    '',
                            },
                          }));
                          setErrors((prev) => ({
                            ...prev,
                            [filter.filterKey]: false,
                          }));
                        }}
                        // displayEmpty
                        // className={classes.selectEmpty}
                      >
                        {filter.keyOptions.map((opt) => (
                          <MenuItem value={opt.key} key={opt.key}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>Location Type</FormHelperText>
                    </div>
                    {!(
                      'nonChangeableValue' in
                      filter.keyOptions.find(
                        (k) => k.key === queryJson[filter.filterKey].type,
                      )
                    ) && (
                      <TextField
                        id={`${filter.filterKey}`}
                        placeholder="Enter..."
                        variant="outlined"
                        style={{
                          width: 225,
                        }}
                        size="small"
                        value={queryJson[filter.filterKey].value}
                        error={errors[`${filter.filterKey}`]}
                        helperText={
                          errors[`${filter.filterKey}`] &&
                          (typeof errors[`${filter.filterKey}`] === 'string'
                            ? errors[`${filter.filterKey}`]
                            : 'Please enter a value')
                        }
                        onChange={(e) => {
                          setQueryJson((prev) => ({
                            ...prev,
                            [filter.filterKey]: {
                              ...prev[filter.filterKey],
                              value: e.target.value,
                            },
                          }));
                          setErrors((prev) => ({
                            ...prev,
                            [filter.filterKey]: false,
                          }));
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
              {filter.filterType === FILTER_TYPE.SWITCH && (
                <div className="filter-switch">
                  <Switch
                    checked={queryJson[filter.filterKey].value}
                    onChange={(e) => {
                      setQueryJson((prev) => ({
                        ...prev,
                        [filter.filterKey]: e.target.checked,
                      }));
                    }}
                    color="primary"
                    name={filter.filterKey}
                    inputProps={{ 'aria-label': 'primary checkbox' }}
                  />
                </div>
              )}
            </div>
          ),
      )}
      {/* !_isEmpty(queryJson) &&
        qbStaticConfig.map((staticFilter) => (
          <div className="filter-group static" key={staticFilter.filterLabel}>
            <div className="filter-category-join">
              {joinsAllowedBetweenFilters.length === 1 &&
                joinsAllowedBetweenFilters[0]}
            </div>
            <div className="filter-label">{staticFilter.filterLabel}</div>
            {staticFilter.filterType === FILTER_TYPE.SWITCH && (
              <div className="filter-switch">
                <Switch
                  checked={staticFilter.value}
                  onChange={(e) => null}
                  // handleStaticFilterToggle(e.target.name, e.target.checked)
                  color="primary"
                  name={staticFilter.filterLabel}
                  inputProps={{ 'aria-label': 'primary checkbox' }}
                />
              </div>
            )}
          </div>
        )) */}
      <div className="add-filter-group">
        <div className="filter-actions-wrap">
          <Button
            variant="contained"
            color="primary"
            // className={classes.button}
            onClick={handleAddFilterCategoryClick}
            startIcon={<PlaylistAddIcon />}
          >
            Add Filter Category
          </Button>
          <Menu
            id="account-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleAddFilterCategoryClose}
            getContentAnchorEl={null}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            // classes={{ paper: classes.menu, list: classes.menuList }}
            // hideBackdrop
          >
            {filterCategoriesList.length > 0 ? (
              filterCategoriesList.map((category) => (
                <MenuItem
                  key={category.filterKey}
                  onClick={() => addFilterCategory(category)}
                >
                  {category.filterLabel}
                </MenuItem>
              ))
            ) : (
              <MenuItem>No additional filters available</MenuItem>
            )}
          </Menu>
          {!_isEmpty(queryJson) && (
            <Button
              variant="outlined"
              color="secondary"
              // className={classes.button}
              onClick={handleQueryReset}
              startIcon={<ClearAllIcon />}
            >
              Reset
            </Button>
          )}
        </div>
        <div className="search-btn-wrap">
          <div className="query-meta">
            {queryName && (
              <TextField
                id="query-name"
                label="Query Name"
                variant="outlined"
                size="small"
                style={{
                  width: 300,
                }}
                error={errors[queryName.key]}
                helperText={
                  errors[queryName.key] && 'Please give your query a name'
                }
                // defaultValue={searchQueryName}
                value={queryName.defaultValue}
                onChange={(e) => {
                  // setSearchQueryName(e.target.value);
                  if (queryName && queryName.onChange) {
                    queryName.onChange(e.target.value);
                  }
                  setErrors((prev) => ({
                    ...prev,
                    [queryName.key]: false,
                  }));
                }}
              />
            )}
            {saveQueryAsGlobal && (
              <FormControlLabel
                control={
                  <Switch
                    checked={saveQueryAsGlobal.value}
                    onChange={(e) =>
                      saveQueryAsGlobal.onChange(e.target.checked)
                    }
                    name="saveQueryAsGlobal"
                    color="primary"
                    size="small"
                  />
                }
                label="Save Globally"
              />
            )}
          </div>
          <Button
            variant="contained"
            color="primary"
            // className={classes.button}
            onClick={handleQuerySearch}
            startIcon={<SearchIcon />}
          >
            Search
          </Button>
        </div>
      </div>
    </div>
  );
}

QueryBuilder.propTypes = {
  config: PropTypes.array.isRequired,
  onSubmit: PropTypes.func,
  joinsAllowedBetweenFilters: PropTypes.array.isRequired,
  queryName: PropTypes.shape({
    key: PropTypes.string.isRequired,
    defaultValue: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    defaultQueryName: PropTypes.string.isRequired,
  }),
  saveQueryAsGlobal: PropTypes.shape({
    key: PropTypes.string.isRequired,
    value: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired,
  }),
  onReset: PropTypes.func,
  defaultQueryJson: PropTypes.object,
  // staticConfig: PropTypes.array,
};
