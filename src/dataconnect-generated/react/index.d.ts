import { ListAllMissionsData, GetUserAchievementsData, CreateNewUserData, CreateNewUserVariables, SubmitMissionData, SubmitMissionVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useListAllMissions(options?: useDataConnectQueryOptions<ListAllMissionsData>): UseDataConnectQueryResult<ListAllMissionsData, undefined>;
export function useListAllMissions(dc: DataConnect, options?: useDataConnectQueryOptions<ListAllMissionsData>): UseDataConnectQueryResult<ListAllMissionsData, undefined>;

export function useGetUserAchievements(options?: useDataConnectQueryOptions<GetUserAchievementsData>): UseDataConnectQueryResult<GetUserAchievementsData, undefined>;
export function useGetUserAchievements(dc: DataConnect, options?: useDataConnectQueryOptions<GetUserAchievementsData>): UseDataConnectQueryResult<GetUserAchievementsData, undefined>;

export function useCreateNewUser(options?: useDataConnectMutationOptions<CreateNewUserData, FirebaseError, CreateNewUserVariables>): UseDataConnectMutationResult<CreateNewUserData, CreateNewUserVariables>;
export function useCreateNewUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateNewUserData, FirebaseError, CreateNewUserVariables>): UseDataConnectMutationResult<CreateNewUserData, CreateNewUserVariables>;

export function useSubmitMission(options?: useDataConnectMutationOptions<SubmitMissionData, FirebaseError, SubmitMissionVariables>): UseDataConnectMutationResult<SubmitMissionData, SubmitMissionVariables>;
export function useSubmitMission(dc: DataConnect, options?: useDataConnectMutationOptions<SubmitMissionData, FirebaseError, SubmitMissionVariables>): UseDataConnectMutationResult<SubmitMissionData, SubmitMissionVariables>;
