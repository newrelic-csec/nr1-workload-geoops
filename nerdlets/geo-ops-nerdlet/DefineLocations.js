import React from 'react';
import PropTypes from 'prop-types';

import { Button, Spinner } from 'nr1';

import {
  LOCATION_UI_SCHEMA,
  LOCATION_JSON_SCHEMA,
  LOCATION_DEFAULTS
} from '../shared/constants';

import { EmptyState, NerdGraphError } from '@newrelic/nr1-community';
import JsonSchemaForm from '../shared/components/JsonSchemaForm';

import { getLocation, writeLocation } from '../shared/services/location';
import { writeMapLocation } from '../shared/services/map-location';
import LocationTable from '../shared/components/LocationTable';

export default class DefineLocations extends React.PureComponent {
  static propTypes = {
    accountId: PropTypes.number,
    map: PropTypes.object.isRequired,
    onLocationWrite: PropTypes.func,
    locations: PropTypes.array,
    locationsLoading: PropTypes.bool,
    locationLoadingErrors: PropTypes.array
  };

  constructor(props) {
    super(props);
    this.state = {
      //
    };

    this.addLocationForm = React.createRef();
    this.onWrite = this.onWrite.bind(this);
  }

  // As they add locations we need to associate them with _this_ map
  // We do so by creating a MapLocation object for each

  async onWrite({ document, error: locationWriteError }) {
    const { document: location } = document;
    const {
      data: mapLocation,
      error: mapLocationWriteError
    } = await this.writeMapLocation({ location });

    this.props.onLocationWrite({
      location: { data: location, error: locationWriteError },
      mapLocation: {
        data: mapLocation.nerdStorageWriteDocument,
        error: mapLocationWriteError
      }
    });
  }

  async writeMapLocation({ location }) {
    const { accountId, map } = this.props;

    // TO DO: Get an empty/default MapLocation object
    // i.e. For a given json-schema how do we get a default object
    const mapLocation = {};

    if (!location.guid || !map.guid) {
      throw new Error('Error: missing location or map guids');
    }
    // TO DO - Do we embed the location or just a guid referencing it?
    mapLocation.location = location.guid;
    mapLocation.map = map.guid;

    return writeMapLocation({
      accountId,
      document: mapLocation
    });
  }

  render() {
    const {
      accountId,
      locations,
      locationsLoading,
      locationLoadingErrors
    } = this.props;

    return (
      <>
        <h4>File Upload</h4>
        <p>
          JSON file formatted to <a href="#">this specification</a>. We
          recommend this method for providing locations.
        </p>
        <input type="file" className="json-file-upload" />
        <hr className="or-sep" />
        <h4>Define locations manually</h4>
        <p>
          Either provide the data for the fields below, or click a point on the
          map to the right.
        </p>

        {/* Column 1 */}
        <JsonSchemaForm
          ref={this.addLocationForm}
          accountId={accountId}
          guid={false}
          schema={LOCATION_JSON_SCHEMA}
          uiSchema={LOCATION_UI_SCHEMA}
          defaultValues={LOCATION_DEFAULTS}
          getDocument={getLocation}
          writeDocument={writeLocation}
          onWrite={this.onWrite}
          onError={errors => console.log(errors)}
          className="define-locations-form"
        >
          <Button
            type={Button.TYPE.PRIMARY}
            onClick={() => this.addLocationForm.current.submit()}
            className="hidden"
            iconType={Button.ICON_TYPE.INTERFACE__SIGN__PLUS}
          >
            Add location
          </Button>
        </JsonSchemaForm>

        {/* Column 2 */}
        {locationsLoading && <Spinner />}

        {/* Errors */}
        {/* {!locationsLoading &&
          locationLoadingErrors &&
          locationLoadingErrors.length > 0 &&
          locationLoadingErrors.map((error, index) => {
            return <NerdGraphError key={index} error={error} />;
          })} */}

        {/* Empty state */}
        {!locationsLoading && locations.length === 0 && (
          <EmptyState
            heading="Location List"
            description="List locations and provide delete functionality"
            callToAction={false}
          />
        )}

        {/* List of locations */}
        {!locationsLoading && locations.length > 0 && (
          <LocationTable locations={locations} />
          // <pre>{JSON.stringify(locations, null, 2)}</pre>
        )}
      </>
    );
  }
}