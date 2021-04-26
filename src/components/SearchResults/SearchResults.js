/* eslint-disable react/no-danger */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import _startsWith from 'lodash/startsWith';
import _isEmpty from 'lodash/isEmpty';
import _uniqBy from 'lodash/uniqBy';
import _get from 'lodash/get';
import Button from '@material-ui/core/Button';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import PersonIcon from '@material-ui/icons/Person';
import PhoneIcon from '@material-ui/icons/Phone';
import MailOutlineIcon from '@material-ui/icons/MailOutline';
import './SearchResults.scss';

function SearchResults({ data }) {
  const [activeRecord, setActiveRecord] = useState(data.length > 0 && data[0]);

  useEffect(() => {
    setActiveRecord(data.length > 0 && data[0]);
  }, [data]);

  return data.length > 0 ? (
    <div className="search-results-container">
      <div className="records-summary">
        {_uniqBy(data, 'id').map((row) => (
          <div
            className={`record-row ${
              _get(activeRecord, 'id') === row.id ? 'active' : ''
            }`}
            // key={`${row.Programs.ProgramName}|${row.OrganizationName.OrganizationName[0].Text}`}
            key={row.id}
          >
            <div>
              <div className="org-name">
                <strong>Organization Name: </strong>
                {_get(row, 'OrganizationName.OrganizationName[0].Text', '')}
              </div>
              <div className="program-name">
                <strong>Program Name: </strong>
                {row.Programs.ProgramName}
              </div>
            </div>
            <div className="detail-btn">
              <Button
                variant="contained"
                color="primary"
                onClick={() => setActiveRecord(row)}
              >
                Show Details
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="records-detail">
        {activeRecord && (
          <>
            <h3>Organization Name</h3>
            <p>
              {_get(
                activeRecord,
                'OrganizationName.OrganizationName[0].Text',
                '',
              )}
            </p>
            <h3>Organization Description</h3>
            <p
              dangerouslySetInnerHTML={{
                __html: _get(
                  activeRecord,
                  'OrganizationName.OrganizationDescriptionDisplay',
                  '',
                ),
              }}
            ></p>
            <div className="links-wrap">
              {_get(activeRecord, 'Programs.QuickConnectWebPage') && (
                <Button
                  href={activeRecord.Programs.QuickConnectWebPage}
                  color="primary"
                  target="_blank"
                  variant="outlined"
                >
                  Quick Links
                </Button>
              )}
              {_get(activeRecord, 'Programs.ProgramWebPage') && (
                <Button
                  href={activeRecord.Programs.ProgramWebPage}
                  color="primary"
                  target="_blank"
                  variant="outlined"
                >
                  Program Page
                </Button>
              )}
              {_get(activeRecord, 'OrganizationName.HomePageURL') && (
                <Button
                  href={activeRecord.OrganizationName.HomePageURL}
                  color="primary"
                  target="_blank"
                  variant="outlined"
                >
                  Home Page
                </Button>
              )}
              {_get(activeRecord, 'Programs.ContactWebPage') && (
                <Button
                  href={activeRecord.Programs.ContactWebPage}
                  color="primary"
                  target="_blank"
                  variant="outlined"
                >
                  Contact Page
                </Button>
              )}
            </div>
            <h3>Program Name</h3>
            <p>{activeRecord.Programs.ProgramName}</p>
            <h3>Program Description</h3>
            <p
              dangerouslySetInnerHTML={{
                __html: activeRecord.Programs.ProgramDescriptionDisplay,
              }}
            ></p>
            <h3>Populations</h3>
            <p>
              {Object.keys(activeRecord.Programs)
                .map((key) => {
                  if (_startsWith(key, 'P_') && activeRecord.Programs[key]) {
                    return key.split('P_')[1];
                  }
                  return null;
                })
                .filter((popKeys) => popKeys !== null)
                .join(', ')}
            </p>
            {!_isEmpty(activeRecord.Programs.PopulationDescription[0]) && (
              <>
                <h3>Population Description</h3>
                <p>{activeRecord.Programs.PopulationDescription[0].Text}</p>
              </>
            )}
            <h3>Services</h3>
            <p>
              {Object.keys(activeRecord.Programs)
                .map((key) => {
                  if (_startsWith(key, 'S_') && activeRecord.Programs[key]) {
                    return key.split('S_')[1];
                  }
                  return null;
                })
                .filter((srvKeys) => srvKeys !== null)
                .join(', ')}
            </p>
            {!_isEmpty(activeRecord.Programs.ServiceAreaDescriptionDisplay) && (
              <>
                <h3>Service Area Description</h3>
                <p>{activeRecord.Programs.ServiceAreaDescriptionDisplay}</p>
              </>
            )}
            <h3>Tags</h3>
            <p>{activeRecord.Programs.ServiceTags}</p>
            {activeRecord.OrgSites && activeRecord.OrgSites.length > 0 && (
              <>
                <h3>Address</h3>
                <div className="address-wrap">
                  <div className="loc-name">
                    <strong>{activeRecord.OrgSites[0].LocationName}</strong>
                  </div>
                  <div>
                    <LocationOnIcon size="small" />{' '}
                    {activeRecord.OrgSites[0].Addr1[0].Text},{' '}
                    {activeRecord.OrgSites[0].AddrCity},{' '}
                    {activeRecord.OrgSites[0].AddrState},{' '}
                    {activeRecord.OrgSites[0].AddrZip}
                  </div>
                  {!_isEmpty(activeRecord.OrgSites[0].Name) && (
                    <div>
                      <PersonIcon size="small" />{' '}
                      {activeRecord.OrgSites[0].Name}
                    </div>
                  )}
                  {!_isEmpty(activeRecord.OrgSites[0].OfficePhone) && (
                    <div>
                      <PhoneIcon size="small" />{' '}
                      {activeRecord.OrgSites[0].OfficePhone}
                    </div>
                  )}
                  {!_isEmpty(activeRecord.OrgSites[0].Email) && (
                    <div>
                      <MailOutlineIcon size="small" />{' '}
                      {activeRecord.OrgSites[0].Email}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  ) : (
    <div>No records found.</div>
  );
}

SearchResults.propTypes = {
  data: PropTypes.array,
};

export default SearchResults;
