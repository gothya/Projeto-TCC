const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'projeto-tcc',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const listAllMissionsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAllMissions');
}
listAllMissionsRef.operationName = 'ListAllMissions';
exports.listAllMissionsRef = listAllMissionsRef;

exports.listAllMissions = function listAllMissions(dc) {
  return executeQuery(listAllMissionsRef(dc));
};

const getUserAchievementsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetUserAchievements');
}
getUserAchievementsRef.operationName = 'GetUserAchievements';
exports.getUserAchievementsRef = getUserAchievementsRef;

exports.getUserAchievements = function getUserAchievements(dc) {
  return executeQuery(getUserAchievementsRef(dc));
};

const createNewUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateNewUser', inputVars);
}
createNewUserRef.operationName = 'CreateNewUser';
exports.createNewUserRef = createNewUserRef;

exports.createNewUser = function createNewUser(dcOrVars, vars) {
  return executeMutation(createNewUserRef(dcOrVars, vars));
};

const submitMissionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SubmitMission', inputVars);
}
submitMissionRef.operationName = 'SubmitMission';
exports.submitMissionRef = submitMissionRef;

exports.submitMission = function submitMission(dcOrVars, vars) {
  return executeMutation(submitMissionRef(dcOrVars, vars));
};
