import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'projeto-tcc',
  location: 'us-east4'
};

export const listAllMissionsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAllMissions');
}
listAllMissionsRef.operationName = 'ListAllMissions';

export function listAllMissions(dc) {
  return executeQuery(listAllMissionsRef(dc));
}

export const getUserAchievementsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetUserAchievements');
}
getUserAchievementsRef.operationName = 'GetUserAchievements';

export function getUserAchievements(dc) {
  return executeQuery(getUserAchievementsRef(dc));
}

export const createNewUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateNewUser', inputVars);
}
createNewUserRef.operationName = 'CreateNewUser';

export function createNewUser(dcOrVars, vars) {
  return executeMutation(createNewUserRef(dcOrVars, vars));
}

export const submitMissionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SubmitMission', inputVars);
}
submitMissionRef.operationName = 'SubmitMission';

export function submitMission(dcOrVars, vars) {
  return executeMutation(submitMissionRef(dcOrVars, vars));
}

