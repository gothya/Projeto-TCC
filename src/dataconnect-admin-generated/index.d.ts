import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export interface Achievement_Key {
  id: UUIDString;
  __typename?: 'Achievement_Key';
}

export interface CreateNewUserData {
  user_insert: User_Key;
}

export interface CreateNewUserVariables {
  username: string;
  email: string;
}

export interface GetUserAchievementsData {
  user?: {
    username: string;
    achievements_via_UserAchievement: ({
      id: UUIDString;
      name: string;
      description: string;
      iconUrl: string;
      _metadata?: {
        distance?: number | null;
      };
    } & Achievement_Key)[];
  };
}

export interface ListAllMissionsData {
  missions: ({
    id: UUIDString;
    title: string;
    description: string;
    pointsReward: number;
    experienceReward: number;
    dueDate?: TimestampString | null;
  } & Mission_Key)[];
}

export interface Mission_Key {
  id: UUIDString;
  __typename?: 'Mission_Key';
}

export interface Submission_Key {
  id: UUIDString;
  __typename?: 'Submission_Key';
}

export interface SubmitMissionData {
  submission_insert: Submission_Key;
}

export interface SubmitMissionVariables {
  missionId: UUIDString;
  submittedData: string;
  notes?: string | null;
}

export interface UserAchievement_Key {
  userId: UUIDString;
  achievementId: UUIDString;
  __typename?: 'UserAchievement_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

/** Generated Node Admin SDK operation action function for the 'ListAllMissions' Query. Allow users to execute without passing in DataConnect. */
export function listAllMissions(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListAllMissionsData>>;
/** Generated Node Admin SDK operation action function for the 'ListAllMissions' Query. Allow users to pass in custom DataConnect instances. */
export function listAllMissions(options?: OperationOptions): Promise<ExecuteOperationResponse<ListAllMissionsData>>;

/** Generated Node Admin SDK operation action function for the 'GetUserAchievements' Query. Allow users to execute without passing in DataConnect. */
export function getUserAchievements(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<GetUserAchievementsData>>;
/** Generated Node Admin SDK operation action function for the 'GetUserAchievements' Query. Allow users to pass in custom DataConnect instances. */
export function getUserAchievements(options?: OperationOptions): Promise<ExecuteOperationResponse<GetUserAchievementsData>>;

/** Generated Node Admin SDK operation action function for the 'CreateNewUser' Mutation. Allow users to execute without passing in DataConnect. */
export function createNewUser(dc: DataConnect, vars: CreateNewUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateNewUserData>>;
/** Generated Node Admin SDK operation action function for the 'CreateNewUser' Mutation. Allow users to pass in custom DataConnect instances. */
export function createNewUser(vars: CreateNewUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateNewUserData>>;

/** Generated Node Admin SDK operation action function for the 'SubmitMission' Mutation. Allow users to execute without passing in DataConnect. */
export function submitMission(dc: DataConnect, vars: SubmitMissionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SubmitMissionData>>;
/** Generated Node Admin SDK operation action function for the 'SubmitMission' Mutation. Allow users to pass in custom DataConnect instances. */
export function submitMission(vars: SubmitMissionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SubmitMissionData>>;

