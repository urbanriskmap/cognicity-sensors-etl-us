import testServices from './services';
import testEtlUsgsSensors from './etlUsgsSensors';
import testEtlUsgsData from './etlUsgsData';
// import testFullFlow from './etlUsgsData/full-flow';
import testWmdUploadStations from './wmdUploadStations';

testServices();
testWmdUploadStations();
testEtlUsgsSensors();
testEtlUsgsData();
// testFullFlow();
