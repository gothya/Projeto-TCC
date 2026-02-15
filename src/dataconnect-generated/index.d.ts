import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

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

interface ListAllMissionsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllMissionsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListAllMissionsData, undefined>;
  operationName: string;
}
export const listAllMissionsRef: ListAllMissionsRef;

export function listAllMissions(): QueryPromise<ListAllMissionsData, undefined>;
export function listAllMissions(dc: DataConnect): QueryPromise<ListAllMissionsData, undefined>;

interface GetUserAchievementsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserAchievementsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetUserAchievementsData, undefined>;
  operationName: string;
}
export const getUserAchievementsRef: GetUserAchievementsRef;

export function getUserAchievements(): QueryPromise<GetUserAchievementsData, undefined>;
export function getUserAchievements(dc: DataConnect): QueryPromise<GetUserAchievementsData, undefined>;

interface CreateNewUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateNewUserVariables): MutationRef<CreateNewUserData, CreateNewUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateNewUserVariables): MutationRef<CreateNewUserData, CreateNewUserVariables>;
  operationName: string;
}
export const createNewUserRef: CreateNewUserRef;

export function createNewUser(vars: CreateNewUserVariables): MutationPromise<CreateNewUserData, CreateNewUserVariables>;
export function createNewUser(dc: DataConnect, vars: CreateNewUserVariables): MutationPromise<CreateNewUserData, CreateNewUserVariables>;

interface SubmitMissionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SubmitMissionVariables): MutationRef<SubmitMissionData, SubmitMissionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SubmitMissionVariables): MutationRef<SubmitMissionData, SubmitMissionVariables>;
  operationName: string;
}
export const submitMissionRef: SubmitMissionRef;

export function submitMission(vars: SubmitMissionVariables): MutationPromise<SubmitMissionData, SubmitMissionVariables>;
export function submitMission(dc: DataConnect, vars: SubmitMissionVariables): MutationPromise<SubmitMissionData, SubmitMissionVariables>;

