import testExtractService from './services/extract';
import testFilterService from './services/filter';
import testLoadService from './services/load';
import testHandlerService from './services/handler';
//
import testCompareDataService from './services/data/compare';
import testDeleteDataService from './services/data/delete';
import testGetStoredObsService from './services/data/storedObservations';
// import testEtlDataService from './services/data/etl-data';

import testCompareSensorsService from './services/sensors/compare';
import testEtlSensorsService from './services/sensors/etl-sensors';

// Tests for common services
testExtractService();
testFilterService();
testLoadService();
testHandlerService();

// Tests for sensor services
testCompareSensorsService();
testEtlSensorsService();

// Tests for sensor data services
testCompareDataService();
testDeleteDataService();
testGetStoredObsService();
// testEtlDataService();
